import type { PersonProfile } from '@/domain/person'
import { deriveLifeSeed, rngFor, hashCombine, clamp } from './rng'
import { initialiseLife, ProfileNotSimulatableError } from './init'
import { drawMacroYear, worldEvents } from './world'
import { careerTick, childrenTick, educationTick, familyTick, financeTick, healthTick, partnerTick, relationshipTick } from './domains'
import type { FinalOutcome, FinalOutcomeDimension, LifeState, SimEvent, SimulationConfig, SimulationResult, YearSnapshot } from './types'

export { ProfileNotSimulatableError }

/**
 * The deterministic life engine.
 *
 * Yearly tick pipeline (order matters; documented here because the ordering
 * encodes causal assumptions — e.g. career changes land before finances):
 *
 *   1. time progression        age++, durations, inflation index advance
 *   2. world context           macro year (growth/inflation/recession) drawn
 *   3. country context         labour strength resolved from macro × country
 *   4. education events        graduations, workplace training
 *   5. career progression      job loss → re-employment → promotion/change
 *   6. relationship transitions  start/progression/breakdown/widowhood
 *   7. children                births (respecting stated preferences), aging
 *   8. health                  drift, mild/major events, recovery
 *   9. financial consequences  income × growth, expenses, debt, buffers
 *  10. derived metrics         runway, goal alignment
 *  11. snapshot + events       immutable year record (events get stable ids)
 *
 * A run stops at the horizon, target age, or the engine's age limit (100).
 */

export const AGE_LIMIT = 100

export const simulateLife = (
  profile: PersonProfile,
  config: SimulationConfig,
  lifeSeed: number,
  /** Optional fork hook: mutates the initial state (scenario interventions). */
  transform?: (state: LifeState) => LifeState,
): SimulationResult => {
  let state = initialiseLife(profile, config, lifeSeed)
  if (transform) state = transform(state)
  const snapshots: YearSnapshot[] = []
  const events: SimEvent[] = []
  const years = Math.max(1, Math.min(config.horizonYears, AGE_LIMIT - state.age))

  for (let i = 0; i < years; i++) {
    const tick = tickYear(state, lifeSeed)
    snapshots.push(tick.snapshot)
    events.push(...tick.events)
    if (state.age >= AGE_LIMIT) break
  }

  const final = computeFinalOutcome(state, 'horizon')
  return {
    seed: lifeSeed,
    config,
    startAge: snapshots[0]?.age ?? state.age,
    startCalendarYear: state.calendarYear - snapshots.length,
    snapshots,
    events,
    final,
  }
}

/** Advance one simulated year; mutates `state` (engine-internal working copy). */
export const tickYear = (
  state: LifeState,
  lifeSeed: number,
): { snapshot: YearSnapshot; events: SimEvent[] } => {
  const year = state.calendarYear + 1
  const yearEvents: Omit<SimEvent, 'id'>[] = []

  // 1. time progression
  state.age += 1
  state.calendarYear = year

  // 2–3. world & country context
  const macro = drawMacroYear(state, year, lifeSeed)
  state.inflationIndex *= 1 + macro.inflation
  yearEvents.push(...worldEvents(state, macro, state.age))

  // 4. education
  yearEvents.push(...educationTick(state, lifeSeed, year))

  // 5. career
  const career = careerTick(state, macro, lifeSeed, year)
  state.monthlyIncome = Math.max(0, state.monthlyIncome * career.incomeGrowth)
  yearEvents.push(...career.events)

  // 6. relationships
  yearEvents.push(...relationshipTick(state, lifeSeed, year))

  // 6b. partner life & career (persists, earns, retires)
  yearEvents.push(...partnerTick(state, macro, lifeSeed, year))

  // 7. children + extended family obligations
  yearEvents.push(...childrenTick(state, lifeSeed, year))
  yearEvents.push(...familyTick(state, lifeSeed, year))

  // 8. health
  yearEvents.push(...healthTick(state, lifeSeed, year))

  // 9. financial consequences (inflation indexation + cash flow live here)
  const finance = financeTick(state, macro, lifeSeed, year)
  yearEvents.push(...finance.events)

  // 10. derived metrics
  const runwayMonths = annualRunway(state)
  state.goalAlignment = computeGoalAlignment(state)

  // 11. snapshot with deterministic event ids
  const events: SimEvent[] = yearEvents.map((draft, index) => ({
    ...draft,
    id: `${lifeSeed.toString(36)}-${year}-${index}`,
  }))

  const snapshot: YearSnapshot = {
    year,
    age: state.age,
    nominalIncome: state.monthlyIncome * 12,
    realIncome: (state.monthlyIncome * 12) / state.inflationIndex,
    realExpenses: state.annualExpenses / state.inflationIndex,
    savings: state.savings,
    investments: state.investments,
    assets: state.assets,
    debt: state.debt,
    netWorth: state.savings + state.investments + state.assets - state.debt,
    realNetWorth: (state.savings + state.investments + state.assets - state.debt) / state.inflationIndex,
    healthIndex: state.healthIndex,
    employment: state.employment,
    seniorityIndex: state.seniorityIndex,
    relationship: state.relationship,
    childrenCount: state.children.length,
    householdSize: state.householdSize,
    incomeEarners:
      (['employed', 'self-employed', 'informal', 'gig'].includes(state.employment) ? 1 : 0) +
      (state.partner && ['employed', 'self-employed'].includes(state.partner.employment) ? 1 : 0),
    partnerMonthlyIncome: state.partner?.monthlyIncome ?? 0,
    careLevel: state.careLevel,
    household: {
      partnerAge: state.partner ? state.partner.age : null,
      childAges: state.children.filter((c) => c.livingWithUser).map((c) => c.age),
    },
    runwayMonths,
    goalAlignment: state.goalAlignment,
    events,
  }

  return { snapshot, events }
}

const annualRunway = (state: LifeState): number =>
  state.annualExpenses > 0 ? (state.savings + state.investments) / (state.annualExpenses / 12) : 0

/**
 * Goal-weighted alignment (0..1). Weighted by the user's stated goals — this is
 * how *their* futures are compared, NOT a universal life score. Dimensions the
 * user never weighted don't influence the number.
 */
export const computeGoalAlignment = (state: LifeState): number => {
  const dimensions: Record<string, number> = dimensionScores(state)
  const goals = state.goals

  /** Each goal contributes through its most related dimension. */
  const goalToDimension: Record<string, string> = {
    wealth: 'financialSecurity',
    financialSecurity: 'financialSecurity',
    career: 'career',
    health: 'health',
    family: 'family',
    children: 'family',
    romance: 'romance',
    freedom: 'freedom',
    leisure: 'freedom',
    knowledge: 'career',
    prestige: 'career',
    adventure: 'freedom',
    creativity: 'freedom',
    community: 'romance',
    contribution: 'family',
    spirituality: 'romance',
  }
  const goalWeights: Record<string, number> = { ...goals }

  let weightSum = 0
  let scoreSum = 0
  for (const [goal, weight] of Object.entries(goalWeights)) {
    if (!weight || weight <= 0) continue
    const dimensionKey = goalToDimension[goal] ?? 'financialSecurity'
    scoreSum += weight * (dimensions[dimensionKey] ?? 0.5)
    weightSum += weight
  }
  if (weightSum === 0) {
    // No stated goals: fall back to an even blend of the core dimensions.
    const core = [dimensions.financialSecurity, dimensions.career, dimensions.health, dimensions.freedom]
    return core.reduce<number>((sum, value) => sum + (value ?? 0), 0) / core.length
  }
  return clamp(scoreSum / weightSum, 0, 1)
}

/** Objective dimension scores (0..1), independent of goal weights. */
export const dimensionScores = (state: LifeState): Record<FinalOutcomeDimension, number> => {
  const runway = annualRunway(state)
  const debtRatio = state.monthlyIncome > 0 ? (state.debt / 12) / state.monthlyIncome : 0
  const financialSecurity = clamp(
    0.25 + sigmoid((runway - 6) / 6) * 0.55 - clamp(debtRatio, 0, 2) * 0.15,
    0,
    1,
  )
  const career = clamp((state.seniorityIndex / 6) * 0.55 + (state.careerSatisfaction / 10) * 0.45, 0, 1)
  const health = clamp(state.healthIndex / 100, 0, 1)
  const partnered = ['dating', 'committed', 'cohabiting', 'married'].includes(state.relationship)
  const familyBase =
    state.childrenPreference === 'no' || state.childrenPreference === 'prefer-not'
      ? state.children.length === 0
        ? 1
        : 0.5
      : state.desiredChildren !== undefined
        ? clamp(1 - Math.abs(state.children.length - state.desiredChildren) * 0.34, 0, 1)
        : clamp(0.4 + state.children.length * 0.2, 0, 1)
  const family = clamp(familyBase * 0.7 + (state.relationship === 'widowed' ? 0 : 0.3), 0, 1)
  const romance = partnered
    ? clamp(0.3 + (state.relationshipSatisfaction / 10) * 0.7, 0, 1)
    : state.desiresPartnership === 'no'
      ? 1
      : 0.3
  const freedom = clamp(0.2 + sigmoid((runway - 9) / 8) * 0.6 + (state.employment === 'retired' ? 0.2 : 0) - (state.children.filter((c) => c.age < 6).length * 0.08), 0, 1)
  const stability = clamp(
    0.15 +
      (state.employment === 'unemployed' ? 0 : 0.45) +
      (state.jobStability / 10) * 0.25 +
      sigmoid((runway - 4) / 5) * 0.3,
    0,
    1,
  )
  return { financialSecurity, career, health, family, romance, freedom, stability }
}

const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x))

export const computeFinalOutcome = (state: LifeState, stopReason: FinalOutcome['stopReason']): FinalOutcome => {
  const dimensionRecord: Record<string, number> = dimensionScores(state)
  return {
    composite: computeGoalAlignment(state),
    dimensions: {
      financialSecurity: dimensionRecord.financialSecurity ?? 0,
      career: dimensionRecord.career ?? 0,
      health: dimensionRecord.health ?? 0,
      family: dimensionRecord.family ?? 0,
      romance: dimensionRecord.romance ?? 0,
      freedom: dimensionRecord.freedom ?? 0,
      stability: dimensionRecord.stability ?? 0,
    },
    goalAlignment: state.goalAlignment,
    stopReason,
  }
}

/** Convenience: full deterministic seed pipeline for one life. */
export const seedForLife = (config: SimulationConfig, lifeIndex: number): number =>
  hashCombine(deriveLifeSeed(config.seed, lifeIndex), 0x51ed)

export { rngFor }
