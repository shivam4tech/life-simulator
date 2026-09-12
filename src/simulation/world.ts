import { chance, clamp, normal, rngFor } from './rng'
import { SECTOR_RECESSION_EXPOSURE, WORLD_SCENARIOS } from './assumptions'
import type { LifeState, SimEventDraft } from './types'

/**
 * World & country context — the external conditions a life happens inside.
 * A new MacroYear is drawn per (life, year) from the 'economy'-adjacent world
 * stream so every life in the same universe experiences a coherent world.
 */

export interface MacroYear {
  year: number
  inflation: number // price growth this year
  realGrowth: number // economy-wide real growth this year
  recession: boolean
  /** Labour-market strength multiplier this year (recession suppresses). */
  labourFactor: number
  /** Investment return factor this year (nominal ≈ real + inflation). */
  investmentReturn: number
  wageGrowthFactor: number // real wage drift vs trend
}

export const drawMacroYear = (
  state: LifeState,
  year: number,
  lifeSeed: number,
): MacroYear => {
  const scenario = WORLD_SCENARIOS[state.scenario]
  const rng = rngFor(lifeSeed, year, 'economy')
  const recession = chance(rng, scenario.recessionChance)

  const baseInflation = Math.max(0, normal(rng, scenario.inflationMean, scenario.inflationVol))
  const spike = chance(rng, scenario.inflationSpikeChance)
  const inflation = spike ? baseInflation + normal(rng, 0.14, 0.05) : baseInflation

  const realGrowth = recession
    ? normal(rng, scenario.growthMean - 0.05, scenario.growthVol)
    : normal(rng, scenario.growthMean, scenario.growthVol)

  const investmentReal = recession ? scenario.recessionReturn : normal(rng, scenario.realReturnMean, scenario.realReturnVol)

  const countryVol = state.country.assumptions.economicVolatility
  const countryLabourBase = 0.55 + state.country.assumptions.labourMarketStrength * 0.6
  const labourFactor = clamp(
    countryLabourBase * (recession ? 0.62 : 1.04) * (1 - countryVol * 0.15),
    0.2,
    1.5,
  )

  return {
    year,
    inflation,
    realGrowth,
    recession,
    labourFactor,
    investmentReturn: Math.max(-0.55, investmentReal + inflation * 0.4),
    wageGrowthFactor: clamp(1 + realGrowth * 0.6 - (spike ? 0.01 : 0), 0.9, 1.06),
  }
}

/** How exposed this person's sector is to the current recession (1 = average). */
export const sectorExposure = (state: LifeState): number =>
  SECTOR_RECESSION_EXPOSURE[state.occupationFamily] ?? 1

/** Append a macro event when the year is remarkable (recession/spike). */
export const worldEvents = (state: LifeState, macro: MacroYear, age: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  if (macro.recession) {
    events.push({
      year: macro.year,
      age,
      domain: 'world',
      type: 'recession',
      title: 'Global slowdown',
      description: 'The simulated world economy contracts. Hiring, promotions and investments feel it.',
      severity: 'major',
      causes: [`- sector exposure ×${sectorExposure(state).toFixed(2)}`],
    })
  }
  return events
}
