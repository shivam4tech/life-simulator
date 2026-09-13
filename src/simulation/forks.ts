import type { PersonProfile } from '@/domain/person'
import { cloneState, rewindTo, simulateFromState } from './engine'
import { applyInterventions } from './apply'
import type { Intervention } from './interventions'
import type { SimulationConfig, SimulationResult } from './types'

/**
 * Fork machinery (Sprint 8).
 *
 * A fork rewinds a representative life to a year, applies interventions, and
 * continues the simulation. Branches share identical history before the fork
 * (the rewound state IS the historical state) and evolve with COMMON RANDOM
 * NUMBERS after it (same lifeSeed → same shocks), so comparisons mean
 * "same life, except…".
 *
 * Branch identity is fully deterministic: (profile, config, lifeSeed,
 * forkYearIndex, interventions, simulationVersion) replays identically.
 */

export interface ForkBranch {
  id: string
  name: string
  /** 'root' for the original life this was forked from. */
  parentBranchId: string
  parentName: string
  /** The representative life this chain descends from. */
  rootLifeSeed: number
  /** Chain of interventions from root to this branch (breadcrumbs). */
  breadcrumbs: string[]
  forkYearIndex: number
  interventions: Intervention[]
  config: SimulationConfig
  /** Horizon counted from the fork. */
  remainingYears: number
  result: SimulationResult
  /** The rewound state snapshot at the fork (compact view data). */
  forkState: {
    age: number
    year: number
    employment: string
    occupationFamily: string
    seniorityIndex: number
    savings: number
    debt: number
    relationship: string
    childrenAges: number[]
    country: string
    settlement: string
  }
  simulationVersion: string
}

export interface ForkRequest {
  /** Year index in the original life to rewind to (0 = the start). */
  forkYearIndex: number
  name: string
  interventions: Intervention[]
  horizonFromFork?: number
}

/** Reconstruct the state at a fork point and apply the intervention palette. */
export const createFork = (
  profile: PersonProfile,
  config: SimulationConfig,
  lifeSeed: number,
  request: ForkRequest,
  simulationVersion: string,
  parentBranchId = 'root',
  parentName = 'Original life',
  breadcrumbs: string[] = [],
): ForkBranch => {
  // forkYearIndex 0 = the very start; i = the state recorded at snapshot i.
  const state = rewindTo(profile, config, lifeSeed, request.forkYearIndex === 0 ? 0 : request.forkYearIndex + 1)
  applyInterventions(state, request.interventions)
  // Capture the fork-point snapshot BEFORE the simulation mutates the state.
  const forkState = {
    age: state.age,
    year: state.calendarYear,
    employment: state.employment,
    occupationFamily: state.occupationFamily,
    seniorityIndex: state.seniorityIndex,
    savings: state.savings,
    debt: state.debt,
    relationship: state.relationship,
    childrenAges: state.children.filter((c) => c.livingWithUser).map((c) => c.age),
    country: state.country.identity.name,
    settlement: state.settlement,
  }
  const remaining = request.horizonFromFork ?? Math.max(1, config.horizonYears - request.forkYearIndex)
  const result = simulateFromState(state, remaining, lifeSeed)

  return {
    id: `fork-${lifeSeed.toString(36)}-${request.forkYearIndex}-${hashJson(request.interventions)}`,
    name: request.name,
    parentBranchId,
    parentName,
    rootLifeSeed: lifeSeed,
    breadcrumbs: [...breadcrumbs, ...request.interventions.map((i) => describeShort(i))],
    forkYearIndex: request.forkYearIndex,
    interventions: request.interventions,
    config,
    remainingYears: remaining,
    result,
    forkState,
    simulationVersion,
  }
}

/** Nested fork: branch from another branch's state. */
export const createNestedFork = (
  profile: PersonProfile,
  parent: ForkBranch,
  request: ForkRequest,
  simulationVersion: string,
): ForkBranch => {
  // Rewind within the parent's own future: replay the parent life, then its
  // interventions, then continue to the fork offset inside the branch.
  const preState = rewindTo(profile, parent.config, parent.rootLifeSeed, request.forkYearIndex)
  // Replay parent interventions that happened at or before this fork point.
  const state = applyInterventions(preState, parent.interventions)
  const adjustedIndex = request.forkYearIndex
  void adjustedIndex
  const remaining = Math.max(1, parent.config.horizonYears - request.forkYearIndex)
  const working = cloneState(state)
  applyInterventions(working, request.interventions)
  const forkState = {
    age: working.age,
    year: working.calendarYear,
    employment: working.employment,
    occupationFamily: working.occupationFamily,
    seniorityIndex: working.seniorityIndex,
    savings: working.savings,
    debt: working.debt,
    relationship: working.relationship,
    childrenAges: working.children.filter((c) => c.livingWithUser).map((c) => c.age),
    country: working.country.identity.name,
    settlement: working.settlement,
  }
  const result = simulateFromState(working, remaining, parent.rootLifeSeed)

  return {
    id: `fork-${parent.rootLifeSeed.toString(36)}-${request.forkYearIndex}-${hashJson([...parent.interventions, ...request.interventions])}-${hashJson(request.name)}`,
    name: request.name,
    parentBranchId: parent.id,
    parentName: parent.name,
    rootLifeSeed: parent.rootLifeSeed,
    breadcrumbs: [
      ...parent.breadcrumbs,
      ...request.interventions.map((i) => describeShort(i)),
    ],
    forkYearIndex: request.forkYearIndex,
    interventions: request.interventions,
    config: parent.config,
    remainingYears: remaining,
    result,
    forkState,
    simulationVersion,
  }
}

const describeShort = (intervention: Intervention): string => {
  switch (intervention.type) {
    case 'change-career':
      return `→ ${intervention.target.replace(/-/g, ' ')}`
    case 'start-education':
      return 'studies'
    case 'start-business':
      return 'started a business'
    case 'change-job':
      return 'job hunt'
    case 'change-savings-rate':
      return `${intervention.delta >= 0 ? '+' : ''}${Math.round(intervention.delta * 100)}% savings`
    case 'change-working-hours':
      return `${intervention.deltaHours >= 0 ? '+' : ''}${intervention.deltaHours}h/week`
    case 'relocate':
      return `moved to a ${intervention.settlement.replace(/-/g, ' ')}`
    case 'migrate':
      return `moved to ${intervention.targetCountry}`
    case 'have-child':
      return 'tried for a child'
    case 'delay-children':
      return 'delayed children'
    case 'lifestyle-change':
      return 'changed daily habits'
    case 'prioritize-relationship':
      return 'prioritized the relationship'
    case 'separate':
      return 'separated'
    case 'learn-skill':
      return 'learned a skill'
    case 'buy-home':
      return 'bought a home'
    default:
      return 'intervention'
  }
}

const hashJson = (value: unknown): string => {
  const str = JSON.stringify(value)
  let h = 5381
  for (let i = 0; i < str.length; i++) h = (Math.imul(h ^ str.charCodeAt(i), 16777619) >>> 0)
  return (h >>> 0).toString(36)
}

/* ------------------------------ BUTTERFLY -------------------------------- */

export interface ButterflyPreset {
  key: string
  label: string
  detail: string
  intervention: Intervention
  /** The direct lever this change pulls (for direct-vs-downstream framing). */
  directLabel: string
  directMetric: 'healthIndex' | 'skillLevel' | 'savings' | 'network' | 'relationshipSatisfaction'
}

export const BUTTERFLY_PRESETS: readonly ButterflyPreset[] = [
  { key: 'save-5', label: 'Save +5% of income', detail: 'a small, quiet change', intervention: { type: 'change-savings-rate', delta: 0.05 }, directLabel: 'savings rate', directMetric: 'savings' },
  { key: 'exercise-2', label: 'Exercise +2 days a week', detail: 'the classic small promise', intervention: { type: 'lifestyle-change', activityDelta: 2, sleepDelta: 0 }, directLabel: 'daily-health lever', directMetric: 'healthIndex' },
  { key: 'sleep-1', label: 'Sleep better', detail: 'forty-five more minutes', intervention: { type: 'lifestyle-change', activityDelta: 0, sleepDelta: 1 }, directLabel: 'sleep quality', directMetric: 'healthIndex' },
  { key: 'learn', label: 'Learn one new skill', detail: 'an evening course, a certificate', intervention: { type: 'learn-skill' }, directLabel: 'skill level', directMetric: 'skillLevel' },
  { key: 'hours-5', label: 'Work 5 fewer hours a week', detail: 'time back, money foregone', intervention: { type: 'change-working-hours', deltaHours: -5 }, directLabel: 'weekly hours', directMetric: 'savings' },
  { key: 'relationship', label: 'Put the relationship first', detail: 'be home more (if partnered)', intervention: { type: 'prioritize-relationship' }, directLabel: 'time at home', directMetric: 'relationshipSatisfaction' },
]

export interface ButterflyDivergence {
  preset: ButterflyPreset
  fork: ForkBranch
  /** Deltas vs the original life at the same ages (paired, exact). */
  atYear5: DivergenceSnapshot | null
  atYear10: DivergenceSnapshot | null
  atEnd: DivergenceSnapshot | null
}

export interface DivergenceSnapshot {
  yearIndex: number
  realNetWorth: number
  realIncome: number
  healthIndex: number
  goalAlignment: number
}

const snapshotAt = (result: SimulationResult, yearIndex: number): DivergenceSnapshot | null => {
  const snapshot = result.snapshots[Math.min(yearIndex, result.snapshots.length - 1)]
  if (!snapshot) return null
  return {
    yearIndex: Math.min(yearIndex, result.snapshots.length - 1),
    realNetWorth: snapshot.realNetWorth,
    realIncome: snapshot.realIncome,
    healthIndex: snapshot.healthIndex,
    goalAlignment: snapshot.goalAlignment,
  }
}

/**
 * Butterfly Mode: one small change, many lives, measured divergence.
 * The comparison is paired (same lifeSeed → same shocks) and every number is
 * measured from the two simulations — nothing manufactured.
 */
export const runButterfly = (
  profile: PersonProfile,
  config: SimulationConfig,
  lifeSeed: number,
  preset: ButterflyPreset,
  forkYearIndex = 0,
): ButterflyDivergence => {
  const original = rewindAndReplay(profile, config, lifeSeed, config.horizonYears)
  const fork = createFork(profile, config, lifeSeed, {
    forkYearIndex,
    name: preset.label,
    interventions: [preset.intervention],
  }, '0.8.0')

  const diff = (yearsAfterFork: number): DivergenceSnapshot | null => {
    const originalAt = snapshotAt(original, forkYearIndex + yearsAfterFork)
    const forkedAt = snapshotAt(fork.result, yearsAfterFork - 1)
    if (!originalAt || !forkedAt) return null
    return {
      yearIndex: originalAt.yearIndex,
      realNetWorth: forkedAt.realNetWorth - originalAt.realNetWorth,
      realIncome: forkedAt.realIncome - originalAt.realIncome,
      healthIndex: forkedAt.healthIndex - originalAt.healthIndex,
      goalAlignment: forkedAt.goalAlignment - originalAt.goalAlignment,
    }
  }

  return {
    preset,
    fork,
    atYear5: diff(5),
    atYear10: diff(10),
    atEnd: diff(original.snapshots.length - forkYearIndex),
  }
}

/** Replay the original (unmodified) life from the same seed. */
export const rewindAndReplay = (
  profile: PersonProfile,
  config: SimulationConfig,
  lifeSeed: number,
  horizonYears: number,
): SimulationResult => {
  const state = rewindTo(profile, config, lifeSeed, 0)
  return simulateFromState(cloneState(state), horizonYears, lifeSeed)
}
