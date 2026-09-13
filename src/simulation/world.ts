import { chance, clamp, normal, rngFor } from './rng'
import { SECTOR_RECESSION_EXPOSURE, WORLD_SCENARIOS } from './assumptions'
import { CHAOS_MODIFIERS, type ChaosLevel } from './chaos'
import type { LifeState, SimEventDraft, WorldRegime } from './types'

/**
 * World & country context (Sprint 7): a seeded regime Markov chain drives the
 * macro year, rare global events fire at low frequency, and countries respond
 * differently by archetype — volatile economies amplify inflation shocks,
 * resource-heavy economies catch commodity booms, sectors win/lose by regime.
 */

export interface MacroYear {
  year: number
  regime: WorldRegime
  inflation: number
  realGrowth: number
  recession: boolean
  /** Labour-market strength multiplier this year. */
  labourFactor: number
  /** Investment return factor this year (nominal ≈ real + inflation partial). */
  investmentReturn: number
  wageGrowthFactor: number
  /** 0–1: how open the world is to migration this year. */
  migrationOpenness: number
  /** Sector demand shock multiplier by occupation family (1 = neutral). */
  sectorShock: Partial<Record<LifeState['occupationFamily'], number>>
}

/** Regime transition probabilities (current → next), roughly Markov. */
const TRANSITIONS: Record<WorldRegime, [WorldRegime, number][]> = {
  expansion: [['expansion', 0.35], ['normal', 0.5], ['slowdown', 0.1], ['tech-disruption', 0.05]],
  normal: [['expansion', 0.18], ['normal', 0.5], ['slowdown', 0.18], ['recession', 0.07], ['inflation-shock', 0.04], ['tech-disruption', 0.02], ['geopolitical-stress', 0.01]],
  slowdown: [['slowdown', 0.3], ['recession', 0.3], ['normal', 0.35], ['geopolitical-stress', 0.05]],
  recession: [['recession', 0.25], ['slowdown', 0.25], ['normal', 0.48], ['geopolitical-stress', 0.02]],
  'inflation-shock': [['inflation-shock', 0.3], ['slowdown', 0.25], ['normal', 0.43], ['recession', 0.02]],
  'tech-disruption': [['tech-disruption', 0.3], ['expansion', 0.3], ['normal', 0.4]],
  'geopolitical-stress': [['geopolitical-stress', 0.3], ['slowdown', 0.25], ['normal', 0.35], ['recession', 0.1]],
}

const nextRegime = (current: WorldRegime, rng: () => number): WorldRegime => {
  const entries = TRANSITIONS[current] ?? TRANSITIONS.normal!
  let roll = rng()
  for (const [regime, probability] of entries) {
    roll -= probability
    if (roll <= 0) return regime
  }
  return entries[entries.length - 1]![0]
}

/** Sector demand multiplier from the active regime + small idiosyncratic noise. */
const sectorShockFor = (regime: WorldRegime, rng: () => number): MacroYear['sectorShock'] => {
  const shock: MacroYear['sectorShock'] = {}
  if (regime === 'tech-disruption') {
    shock.technology = 1.3
    shock.finance = 1.12
    shock.manufacturing = 0.82
    shock.administration = 0.85
  }
  if (regime === 'geopolitical-stress') {
    shock['military-security'] = 1.15
    shock.hospitality = 0.85
    shock['transport-logistics'] = 0.9
  }
  if (chance(rng, 0.06)) {
    const families: LifeState['occupationFamily'][] = ['technology', 'construction', 'hospitality', 'agriculture', 'manufacturing']
    const pick = families[Math.floor(rng() * families.length)] ?? 'technology'
    shock[pick] = (shock[pick] ?? 1) * (rng() < 0.5 ? 0.85 : 1.2)
  }
  return shock
}

export const drawMacroYear = (state: LifeState, year: number, lifeSeed: number): MacroYear => {
  const scenario = WORLD_SCENARIOS[state.scenario]
  const chaos = CHAOS_MODIFIERS[(state.chaosLevel ?? 'realistic') as ChaosLevel]
  const rng = rngFor(lifeSeed, year, 'economy')

  // --- regime evolution; chaos modulates the dice; rare global events fire at low frequency ---
  let regime = nextRegime(state.worldRegime, rng)
  if (chaos.disruptionMultiplier < 1 && (regime === 'recession' || regime === 'geopolitical-stress') && chance(rng, 1 - chaos.disruptionMultiplier)) {
    regime = 'normal' // calm dampens disruption
  } else if (chaos.disruptionMultiplier > 1 && regime === 'normal' && chance(rng, chaos.disruptionMultiplier - 1)) {
    regime = 'slowdown' // wild stirs the pot
  }
  let rareEvent: string | null = null
  const rareThreshold = 0.033 * chaos.rareEventMultiplier
  const rareRoll = rng()
  if (rareRoll < 0.004 * chaos.rareEventMultiplier) {
    regime = 'recession'
    rareEvent = 'pandemic'
  } else if (rareRoll < 0.009 * chaos.rareEventMultiplier) {
    regime = 'geopolitical-stress'
    rareEvent = 'conflict'
  } else if (rareRoll < 0.015 * chaos.rareEventMultiplier) {
    regime = 'recession'
    rareEvent = 'financial-crisis'
  } else if (rareRoll < 0.023 * chaos.rareEventMultiplier) {
    regime = 'expansion'
    rareEvent = 'commodity-boom'
  } else if (rareRoll < rareThreshold) {
    regime = 'tech-disruption'
    rareEvent = 'tech-shift'
  }
  state.worldRegime = regime

  const regimeGrowth: Record<WorldRegime, number> = {
    expansion: 0.035,
    normal: 0,
    slowdown: -0.025,
    recession: -0.055,
    'inflation-shock': -0.015,
    'tech-disruption': 0.03,
    'geopolitical-stress': -0.02,
  }
  const regimeInflation: Record<WorldRegime, number> = {
    expansion: 0.004,
    normal: 0,
    slowdown: -0.004,
    recession: -0.006,
    'inflation-shock': 0.09,
    'tech-disruption': 0.002,
    'geopolitical-stress': 0.012,
  }

  const recession = regime === 'recession'
  let inflation = Math.max(0, normal(rng, scenario.inflationMean + regimeInflation[regime]!, scenario.inflationVol * chaos.volatilityMultiplier))
  if (regime === 'inflation-shock') inflation += normal(rng, 0.06, 0.03)

  // Country response: volatile economies amplify inflation shocks.
  inflation *= 1 + state.country.assumptions.economicVolatility * (regime === 'inflation-shock' ? 0.8 : 0.15)

  const growthNoise = normal(rng, scenario.growthMean + regimeGrowth[regime]!, scenario.growthVol * chaos.volatilityMultiplier)

  // Commodity boom: resource-heavy archetypes get an extra growth kick.
  const commodityKick =
    state.country.archetype === 'resource-heavy' && rareEvent === 'commodity-boom' ? 0.04 : 0

  const investmentReal =
    regime === 'recession'
      ? scenario.recessionReturn + (rareEvent === 'financial-crisis' ? -0.1 : 0)
      : normal(rng, scenario.realReturnMean + regimeGrowth[regime]! * 0.6, scenario.realReturnVol)

  const countryVol = state.country.assumptions.economicVolatility
  const countryLabourBase = 0.55 + state.country.assumptions.labourMarketStrength * 0.6
  const labourFactor = clamp(
    countryLabourBase *
      (recession ? 0.62 : regime === 'slowdown' ? 0.82 : regime === 'expansion' || regime === 'tech-disruption' ? 1.08 : 1.02) *
      (1 - countryVol * 0.15),
    0.2,
    1.5,
  )

  const migrationOpenness = clamp(
    (regime === 'geopolitical-stress' ? 0.45 : regime === 'recession' ? 0.7 : 1) *
      (0.85 + state.country.assumptions.migrationAttractiveness * 0.3),
    0.2,
    1,
  )

  return {
    year,
    regime,
    inflation,
    realGrowth: growthNoise + commodityKick,
    recession,
    labourFactor,
    investmentReturn: Math.max(-0.55, investmentReal + inflation * 0.4),
    wageGrowthFactor: clamp(1 + growthNoise * 0.6 - (regime === 'inflation-shock' ? 0.012 : 0), 0.88, 1.07),
    migrationOpenness,
    sectorShock: sectorShockFor(regime, rng),
  }
}

/** How exposed this person's sector is this year (1 = average). */
export const sectorExposure = (state: LifeState, macro?: MacroYear): number => {
  const base = SECTOR_RECESSION_EXPOSURE[state.occupationFamily] ?? 1
  const shock = macro?.sectorShock[state.occupationFamily]
  return base * (shock ?? 1)
}

/** World-level events worth surfacing on the timeline. */
export const worldEvents = (state: LifeState, macro: MacroYear, age: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  if (macro.regime === 'recession') {
    events.push({
      year: macro.year,
      age,
      domain: 'world',
      type: 'recession',
      title: 'Global slowdown',
      description: 'The simulated world economy contracts. Hiring, promotions and investments feel it.',
      severity: 'major',
      causes: [`- sector exposure ×${sectorExposure(state, macro).toFixed(2)}`],
    })
  } else if (macro.regime === 'inflation-shock') {
    events.push({
      year: macro.year,
      age,
      domain: 'world',
      type: 'inflation-shock',
      title: 'Inflation spike',
      description: 'Prices jump faster than wages this year — real incomes are squeezed.',
      severity: 'notable',
      causes: [`+ country inflation amplification ×${(1 + state.country.assumptions.economicVolatility * 0.8).toFixed(2)}`],
    })
  } else if (macro.regime === 'tech-disruption') {
    events.push({
      year: macro.year,
      age,
      domain: 'world',
      type: 'tech-disruption',
      title: 'Technology disruption',
      description: 'A technology wave reshapes the labour market — gains and disruption by sector.',
      severity: 'notable',
      causes: ['- automation-exposed sectors under pressure', '+ tech-adjacent sectors gain'],
    })
  } else if (macro.regime === 'geopolitical-stress') {
    events.push({
      year: macro.year,
      age,
      domain: 'world',
      type: 'geopolitical-stress',
      title: 'Geopolitical stress',
      description: 'Global tension rises; borders tighten and trade suffers.',
      severity: 'notable',
      causes: ['- migration openness reduced'],
    })
  }
  return events
}
