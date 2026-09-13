import type { MonteCarloAggregate } from './aggregate'
import type { PairedLifeOutcome } from './scenario'

/**
 * Scenario comparison analysis — deltas, break-even, trade-off language.
 * Everything is derived from the two aggregates and the paired per-life
 * outcomes. No invented effects, no false precision: deltas are shown to the
 * nearest sensible unit and "≈" means the branches are within noise.
 */

export type DeltaFormat = 'money' | 'months' | 'percent' | 'index'

export interface ScenarioDelta {
  key: string
  label: string
  base: number
  scenario: number
  /** Relative change of the scenario vs baseline (0 for percent-format rows). */
  deltaPct: number | null
  deltaAbs: number
  tone: 'up' | 'down' | 'flat'
  format: DeltaFormat
}

export interface BreakEvenSummary {
  /** First year index where scenario median net worth reaches baseline's and stays ahead through the horizon. */
  overtakenAtYearIndex: number | null
  overtakenAtYear: number | null
  overtakenAtAge: number | null
  /** Share of paired lives where the scenario ends ahead on real net worth. */
  shareAheadAtHorizon: number
  /** Share of paired lives where the scenario NEVER catches up by the horizon. */
  neverOvertakeShare: number
}

export interface ScenarioComparisonAnalysis {
  deltas: ScenarioDelta[]
  breakEven: BreakEvenSummary
  tradeoffSummary: string
}

const flatThreshold = 0.03

const toneOf = (delta: number, threshold: number): 'up' | 'down' | 'flat' => {
  if (delta > threshold) return 'up'
  if (delta < -threshold) return 'down'
  return 'flat'
}

const metricDelta = (
  key: string,
  label: string,
  base: number,
  scenario: number,
  format: DeltaFormat,
): ScenarioDelta => {
  const deltaAbs = scenario - base
  const deltaPct = base !== 0 ? deltaAbs / Math.abs(base) : null
  const threshold = format === 'percent' ? 0.015 : format === 'months' ? Math.max(1, Math.abs(base) * 0.05) : flatThreshold
  return {
    key,
    label,
    base,
    scenario,
    deltaPct,
    deltaAbs,
    tone: toneOf(deltaAbs, threshold),
    format,
  }
}

/** Compare a baseline and scenario aggregate at the horizon (last year). */
export const compareRuns = (
  baseline: MonteCarloAggregate & { config: { horizonYears: number } },
  scenario: MonteCarloAggregate,
  paired: PairedLifeOutcome[],
): ScenarioComparisonAnalysis => {
  const lastBase = baseline.aggregates[baseline.aggregates.length - 1]
  const lastScenario = scenario.aggregates[scenario.aggregates.length - 1]

  const deltas: ScenarioDelta[] = []
  if (lastBase && lastScenario) {
    deltas.push(
      metricDelta('realIncome', 'Real income / year', lastBase.metrics.realIncome.p50, lastScenario.metrics.realIncome.p50, 'money'),
      metricDelta('realNetWorth', 'Net worth (today’s money)', lastBase.metrics.realNetWorth.p50, lastScenario.metrics.realNetWorth.p50, 'money'),
      metricDelta('runwayMonths', 'Emergency runway', lastBase.metrics.runwayMonths.p50, lastScenario.metrics.runwayMonths.p50, 'months'),
      metricDelta('goalAlignment', 'Your-goal alignment', lastBase.metrics.goalAlignment.p50, lastScenario.metrics.goalAlignment.p50, 'percent'),
      metricDelta('healthIndex', 'Health', lastBase.metrics.healthIndex.p50, lastScenario.metrics.healthIndex.p50, 'index'),
    )
  }

  // Break-even on median net worth paths: first year from which the scenario
  // median stays at or above the baseline median through the horizon.
  let overtakenAtYearIndex: number | null = null
  const baseMedians = baseline.aggregates.map((agg) => agg.metrics.realNetWorth.p50)
  const scenarioMedians = scenario.aggregates.map((agg) => agg.metrics.realNetWorth.p50)
  for (let t = 0; t < baseMedians.length; t++) {
    let staysAhead = true
    for (let u = t; u < baseMedians.length; u++) {
      if ((scenarioMedians[u] ?? 0) < (baseMedians[u] ?? 0)) {
        staysAhead = false
        break
      }
    }
    if (staysAhead && (scenarioMedians[t] ?? 0) >= (baseMedians[t] ?? 0)) {
      overtakenAtYearIndex = t
      break
    }
  }
  const shareAheadAtHorizon =
    paired.length > 0
      ? paired.filter((p) => p.realNetWorthScenario >= p.realNetWorthBase).length / paired.length
      : 0
  const neverOvertakeShare = 1 - shareAheadAtHorizon

  const breakEven: BreakEvenSummary = {
    overtakenAtYearIndex,
    overtakenAtYear: overtakenAtYearIndex !== null ? scenario.aggregates[overtakenAtYearIndex]?.year ?? null : null,
    overtakenAtAge: overtakenAtYearIndex !== null ? scenario.aggregates[overtakenAtYearIndex]?.age ?? null : null,
    shareAheadAtHorizon,
    neverOvertakeShare,
  }

  return { deltas, breakEven, tradeoffSummary: tradeoffTemplate(deltas, breakEven) }
}

const tradeoffTemplate = (deltas: ScenarioDelta[], breakEven: BreakEvenSummary): string => {
  const parts: string[] = []
  const income = deltas.find((d) => d.key === 'realIncome')
  const worth = deltas.find((d) => d.key === 'realNetWorth')
  const runway = deltas.find((d) => d.key === 'runwayMonths')
  const alignment = deltas.find((d) => d.key === 'goalAlignment')

  if (breakEven.overtakenAtYearIndex === null) {
    parts.push('Within this horizon, the alternative path never quite catches the baseline financially')
    if (breakEven.neverOvertakeShare > 0) {
      parts.push(`it ends ahead in about ${Math.round(breakEven.shareAheadAtHorizon * 100)}% of comparable lives`)
    }
  } else if (breakEven.overtakenAtYearIndex === 0) {
    parts.push('The alternative path is ahead from the very first year')
  } else {
    parts.push(`The alternative path financially catches up around year ${breakEven.overtakenAtYearIndex + 1} of the simulation`)
  }
  if (income && income.tone !== 'flat') {
    parts.push(`median income ends ${income.tone === 'up' ? 'higher' : 'lower'} by ~${Math.abs(Math.round((income.deltaPct ?? 0) * 100))}%`)
  }
  if (runway && runway.tone !== 'flat') {
    parts.push(`emergency runway ${runway.tone === 'up' ? 'improves' : 'worsens'} by ~${Math.abs(runway.deltaAbs).toFixed(1)} months`)
  }
  if (alignment && alignment.tone !== 'flat') {
    parts.push(`your-goal alignment ${alignment.tone === 'up' ? 'rises' : 'falls'} by ~${Math.abs(Math.round(alignment.deltaAbs * 100))} points`)
  }
  if (worth && worth.tone === 'flat') {
    parts.push('net worth ends roughly where the baseline lands (≈)')
  }
  return parts.join('; ') + '.'
}
