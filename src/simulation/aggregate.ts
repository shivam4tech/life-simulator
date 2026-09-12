import type { OutcomeBand, SimulationConfig, SimulationResult, YearSnapshot } from './types'
import { simulateLife } from './engine'
import { deriveLifeSeed } from './rng'

/**
 * Aggregation & outcome classification.
 *
 * Memory discipline: the Monte Carlo runner streams lives into compact numeric
 * buffers plus (seed, composite, startAge) triplets; full per-life results are
 * only ever materialised for the handful of representative lives, which are
 * *re-simulated from their seeds* once all composites are known.
 *
 * Banding uses the user's goal-weighted composite — explicitly a comparison
 * within *their* possibility space, never a universal life score.
 */

export interface Percentiles {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
}

export type AggregateMetricKey =
  | 'realIncome'
  | 'realNetWorth'
  | 'savings'
  | 'realExpenses'
  | 'runwayMonths'
  | 'healthIndex'
  | 'goalAlignment'
  | 'childrenCount'

export const AGGREGATE_METRIC_KEYS: readonly AggregateMetricKey[] = [
  'realIncome',
  'realNetWorth',
  'savings',
  'realExpenses',
  'runwayMonths',
  'healthIndex',
  'goalAlignment',
  'childrenCount',
]

export interface YearAggregate {
  year: number
  age: number
  metrics: Record<AggregateMetricKey, Percentiles>
  /** Share of lives unemployed at this point (0–1). */
  unemploymentExposure: number
}

export interface BandSummary {
  band: OutcomeBand
  /** Fraction of simulated lives in this band (0–1). */
  share: number
}

export interface RepresentativeSummary {
  band: OutcomeBand
  result: SimulationResult
}

export interface MonteCarloAggregate {
  numLives: number
  bands: BandSummary[]
  aggregates: YearAggregate[]
  representative: RepresentativeSummary[]
  cancelled: boolean
}

/**
 * Composite percentile → band: bottom fifth of *this universe* is difficult,
 * middle 60% typical, next 15% good, top 5% exceptional.
 */
export const bandForPercentile = (percentile: number): OutcomeBand => {
  if (percentile < 0.2) return 'difficult'
  if (percentile < 0.8) return 'typical'
  if (percentile < 0.95) return 'good'
  return 'exceptional'
}

/** Quantile of an unsorted numeric array (linear interpolation). */
export const quantile = (values: number[], q: number): number => {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const position = (sorted.length - 1) * Math.min(1, Math.max(0, q))
  const lower = Math.floor(position)
  const upper = Math.ceil(position)
  if (lower === upper) return sorted[lower]!
  return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (position - lower)
}

export const percentilesOf = (values: number[]): Percentiles => ({
  p10: quantile(values, 0.1),
  p25: quantile(values, 0.25),
  p50: quantile(values, 0.5),
  p75: quantile(values, 0.75),
  p90: quantile(values, 0.9),
})

/** Streaming accumulator: per-year samples per metric plus lightweight life records. */
export interface AggregateBuffers {
  years: number
  perYear: Record<AggregateMetricKey, number[][]>
  unemployed: number[]
  composites: number[]
  seeds: number[]
  startAges: number[]
  yearsPerLife: number[]
}

export const createBuffers = (years: number): AggregateBuffers => ({
  years,
  perYear: Object.fromEntries(
    AGGREGATE_METRIC_KEYS.map((key) => [key, Array.from({ length: years }, () => [] as number[])]),
  ) as Record<AggregateMetricKey, number[][]>,
  unemployed: Array.from({ length: years }, () => 0),
  composites: [],
  seeds: [],
  startAges: [],
  yearsPerLife: [],
})

/** Contribute one finished life (lightweight — the full result is not retained). */
export const contributeLife = (buffers: AggregateBuffers, result: SimulationResult): void => {
  buffers.composites.push(result.final.composite)
  buffers.seeds.push(result.seed)
  buffers.startAges.push(result.startAge)
  buffers.yearsPerLife.push(result.snapshots.length)
  for (let t = 0; t < Math.min(result.snapshots.length, buffers.years); t++) {
    const snapshot: YearSnapshot = result.snapshots[t]!
    for (const key of AGGREGATE_METRIC_KEYS) {
      buffers.perYear[key]![t]!.push(snapshot[key] as number)
    }
    if (snapshot.employment === 'unemployed') buffers.unemployed[t]! += 1
  }
}

export interface AggregateInput {
  buffers: AggregateBuffers
  profile: Parameters<typeof simulateLife>[0]
  config: SimulationConfig
  cancelled: boolean
}

/**
 * Build the final aggregate: band shares, per-year percentile tables and the
 * four representative lives — actual seeds re-simulated for full detail.
 */
export const buildAggregate = (input: AggregateInput): MonteCarloAggregate => {
  const { buffers, profile, config, cancelled } = input
  const n = buffers.composites.length
  if (n === 0) {
    return { numLives: 0, bands: [], aggregates: [], representative: [], cancelled }
  }

  // Band shares from composite percentiles.
  const ranked = buffers.composites
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value)
  const shares: Record<OutcomeBand, number> = { difficult: 0, typical: 0, good: 0, exceptional: 0 }
  for (let rank = 0; rank < n; rank++) {
    const percentile = n === 1 ? 0.5 : rank / (n - 1)
    shares[bandForPercentile(Math.min(percentile, 0.999))] += 1 / n
  }
  const bands: BandSummary[] = (['difficult', 'typical', 'good', 'exceptional'] as const).map(
    (band) => ({ band, share: shares[band] }),
  )

  // Per-year percentile tables.
  const aggregates: YearAggregate[] = []
  for (let t = 0; t < buffers.years; t++) {
    const metrics = Object.fromEntries(
      AGGREGATE_METRIC_KEYS.map((key) => [key, percentilesOf(buffers.perYear[key]![t]!)]),
    ) as Record<AggregateMetricKey, Percentiles>
    const agesAtT = buffers.startAges
      .map((startAge, i) => (buffers.yearsPerLife[i]! > t ? startAge + t + 1 : null))
      .filter((age): age is number => age !== null)
    aggregates.push({
      year: (config.startCalendarYear ?? new Date().getFullYear()) + t + 1,
      age: agesAtT.length > 0 ? Math.round(quantile(agesAtT, 0.5)) : 0,
      metrics,
      unemploymentExposure: buffers.unemployed[t]! / n,
    })
  }

  // Representative lives: actual seeds whose composite sits nearest each band's
  // characteristic percentile, re-simulated for full timeline detail.
  const targets: readonly { band: OutcomeBand; percentile: number }[] = [
    { band: 'difficult', percentile: 0.1 },
    { band: 'typical', percentile: 0.5 },
    { band: 'good', percentile: 0.87 },
    { band: 'exceptional', percentile: 0.98 },
  ]
  const representative: RepresentativeSummary[] = targets.map(({ band, percentile }) => {
    const targetRank = Math.round(percentile * (n - 1))
    const target = ranked[Math.min(n - 1, Math.max(0, targetRank))]!.value
    let bestIndex = 0
    let bestDistance = Infinity
    for (let i = 0; i < n; i++) {
      const distance = Math.abs(buffers.composites[i]! - target)
      if (distance < bestDistance) {
        bestDistance = distance
        bestIndex = i
      }
    }
    const seed = buffers.seeds[bestIndex]!
    return { band, result: simulateLife(profile, config, seed) }
  })

  return { numLives: n, bands, aggregates, representative, cancelled }
}

/** Re-run one specific life from its stored seed (replayability contract). */
export const simulateLifeFromSeed = (
  profile: Parameters<typeof simulateLife>[0],
  config: SimulationConfig,
  lifeIndex: number,
): SimulationResult => simulateLife(profile, config, deriveLifeSeed(config.seed, lifeIndex))
