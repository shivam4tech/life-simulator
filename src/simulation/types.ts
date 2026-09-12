import type { BehaviourProfile, CountryProfile, GoalWeights, OccupationFamily } from '@/domain'
import type { RelationshipStatus, SettlementType } from '@/domain/taxonomies'
import type { RngDomain } from './rng'

/** Public engine types — framework-free, worker-safe. */

export type WorldScenario = 'optimistic' | 'stable' | 'difficult' | 'volatile'

export type EventDomain = RngDomain | 'world' | 'money' | 'location'

export type EventSeverity = 'minor' | 'notable' | 'major'

export type OutcomeBand = 'difficult' | 'typical' | 'good' | 'exceptional'

export interface SimulationConfig {
  /** Deterministic universe seed — same inputs + seed = same future. */
  seed: string | number
  worldScenario: WorldScenario
  /** Simulate this many years (unless targetAge stops it first). */
  horizonYears: number
  /** Alternative stopping rule: simulate until this age. */
  targetAge?: number
  /** Calendar year labelling the first simulated year. */
  startCalendarYear?: number
}

export interface SimEvent {
  id: string
  year: number
  age: number
  domain: EventDomain
  type: string
  title: string
  description: string
  severity: EventSeverity
  /** Explainability: signed contributing factors, e.g. "+ 7 years experience". */
  causes: string[]
}

export interface LifeState {
  // --- identity & context (static through a run) ---
  country: CountryProfile
  settlement: SettlementType
  scenario: WorldScenario
  behaviours: Required<BehaviourProfile>
  goals: GoalWeights
  constraints: {
    cannotRelocate: boolean
    unwillingInternational: boolean
    careObligations: boolean
    debtObligations: boolean
  }
  sex?: string

  // --- time ---
  age: number
  calendarYear: number
  yearsExperience: number
  inflationIndex: number // cumulative price index, base 1 at start

  // --- career ---
  employment: 'student' | 'unemployed' | 'employed' | 'self-employed' | 'retired' | 'informal' | 'gig'
  occupationFamily: OccupationFamily
  seniorityIndex: number // 0..6
  educationMultiplier: number // education earnings modifier (from assumptions table)
  monthlyIncome: number // nominal gross, personal
  incomeMultiplier: number // personal anchor vs modelled expectation
  skillLevel: number // 0..100
  jobStability: number // 0..10
  careerSatisfaction: number // 0..10
  yearsInJob: number
  unemployedYears: number
  graduationAge?: number
  pendingEducationLevel?: string

  // --- finances (nominal, local currency) ---
  savings: number
  investments: number
  assets: number
  debt: number
  costMultiplier: number // personal anchor on the country cost base
  sendsSupport: boolean
  supportShare: number // share of personal income sent to family

  // --- relationships & household ---
  relationship: RelationshipStatus
  relationshipYears: number
  relationshipSatisfaction: number // 0..10
  partnerIncomeShare: number // fraction of country median (0 when single)
  children: { age: number }[]
  householdSize: number
  desiredChildren?: number
  childrenPreference?: 'yes' | 'no' | 'unsure' | 'prefer-not'
  desiresPartnership?: 'yes' | 'unsure' | 'no'
  marriagePreference?: 'important' | 'open' | 'not-for-me' | 'prefer-not'

  // --- health ---
  healthIndex: number // 0..100
  chronicCondition: boolean
  temporaryLimitationYears: number
  lifestyle: {
    activity: number // 0..10
    sleep: number // 0..10
    smoking: boolean
    alcoholBand: number // 0..3 (none..heavy)
    healthcareAccess: number // 0..1
  }

  // --- derived (recomputed each tick) ---
  annualExpenses: number // nominal, incl. children + support
  goalAlignment: number // 0..1
}

/** Stages produce drafts; the engine assigns deterministic ids. */
export type SimEventDraft = Omit<SimEvent, 'id'>

export interface YearSnapshot {
  year: number
  age: number
  /** Annual gross income, nominal local currency. */
  nominalIncome: number
  /** Annual gross income in start-year purchasing power. */
  realIncome: number
  /** Annual household expenses in start-year purchasing power. */
  realExpenses: number
  savings: number
  investments: number
  assets: number
  debt: number
  netWorth: number
  /** Net worth in start-year purchasing power. */
  realNetWorth: number
  healthIndex: number
  employment: LifeState['employment']
  seniorityIndex: number
  relationship: RelationshipStatus
  childrenCount: number
  /** Savings+investments over annual expenses, months of runway. */
  runwayMonths: number
  goalAlignment: number
  events: SimEvent[]
}

export type FinalOutcomeDimension =
  | 'financialSecurity'
  | 'career'
  | 'health'
  | 'family'
  | 'romance'
  | 'freedom'
  | 'stability'

export interface FinalOutcome {
  /** User-goal-weighted 0..1 composite — used for banding, never shown as a "life score". */
  composite: number
  dimensions: Record<FinalOutcomeDimension, number>
  goalAlignment: number
  stopReason: 'horizon' | 'age-limit'
}

export interface SimulationResult {
  seed: number
  config: SimulationConfig
  startAge: number
  startCalendarYear: number
  snapshots: YearSnapshot[]
  events: SimEvent[]
  final: FinalOutcome
}
