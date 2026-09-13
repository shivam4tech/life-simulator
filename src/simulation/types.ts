import type { BehaviourProfile, CountryProfile, GoalWeights, OccupationFamily } from '@/domain'
import type { RelationshipStatus, SettlementType } from '@/domain/taxonomies'
import type { RngDomain } from './rng'

/** Public engine types — framework-free, worker-safe. */

export type WorldScenario = 'optimistic' | 'stable' | 'difficult' | 'volatile'

/** Deterministic world regime — evolves year to year via seeded transitions. */
export type WorldRegime =
  | 'expansion'
  | 'normal'
  | 'slowdown'
  | 'recession'
  | 'inflation-shock'
  | 'tech-disruption'
  | 'geopolitical-stress'

/**
 * Migration state once the person has moved countries (Sprint 7).
 * `originCountry` stays on LifeState for return migration.
 */
export interface MigrationState {
  targetCode: string
  year: number
  /** Deterministic 0–1 feasibility assessed at the move. */
  feasibility: number
  /** 0–1: integration rebuilds over years (network, language, community). */
  integration: number
  languageFit: number
  credentialFactor: number
  yearsSince: number
  partnerStayedBehind: boolean
}

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
  relationshipSatisfaction: number // 0..10, slow-moving
  relationshipStability: number // 0..10, slower still
  sharedFinancialPressure: number // 0..10
  timePressure: number // 0..10
  partner: PartnerState | null
  children: ChildState[]
  householdSize: number
  /** Monthly support paid for children living elsewhere (nominal). */
  childSupportMonthly: number
  /** 0–2: rising elder-care / family care requirement. */
  careLevel: number
  desiredChildren?: number
  childrenPreference?: 'yes' | 'no' | 'unsure' | 'prefer-not'
  opennessToAdoption?: boolean
  desiresPartnership?: 'yes' | 'unsure' | 'no'
  marriagePreference?: 'important' | 'open' | 'not-for-me' | 'prefer-not'

  // --- career capital (Sprint 6): survives job loss; path dependence ---
  educationLevelKey?: string
  network: number // 0..100 professional network strength
  careerCapital: number // 0..100 accumulated advantage
  managementSkill: number // 0..10
  business: BusinessState | null
  educationPlan: EducationPlan | null
  retrainingYearsLeft: number
  jobHuntBoostYears: number
  jobHuntTargetIncrease: number
  savingsRateDelta: number // −0.2..+0.3
  hoursDelta: number // −15..+15
  delayedChildrenUntilYear?: number
  forcedChildAttemptYears: number
  /** Language fit for international moves; sampled when unknown (documented). */
  languageFit: number
  originCountry: string
  migration: MigrationState | null
  worldRegime: WorldRegime

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

/**
 * PartnerState — a lightweight simulated person, not a boolean flag.
 * Compact by design: enough dimensions to make partnership dynamics
 * meaningful (compatibility, income, preferences) without simulating a
 * second full life. Identity is seed-derived: replaying the same run
 * produces the same partner.
 */
export interface PartnerState {
  /** Stable identity tag derived from the meeting event's seed context. */
  id: string
  age: number
  educationLevel: string
  employment: 'employed' | 'unemployed' | 'self-employed' | 'retired' | 'inactive'
  occupationFamily: OccupationFamily
  /** Personal income multiplier vs the country baseline. */
  incomeMultiplier: number
  /** Nominal monthly income (0 while unemployed/inactive). */
  monthlyIncome: number
  healthIndex: number
  /** 0–10 dispositions. */
  riskTolerance: number
  financialRestraint: number
  careerAmbition: number
  sociability: number
  childrenPreference: 'yes' | 'no' | 'unsure'
  marriagePreference: 'important' | 'open' | 'not-for-me'
  /** 0–10; models into migration decisions from Sprint 7. */
  migrationWillingness: number
  /** Multidimensional compatibility with the user, 0–1 each. */
  compatibility: {
    values: number
    children: number
    money: number
    ambition: number
    lifestyle: number
  }
}

export interface BusinessState {
  industry: OccupationFamily
  phase: 'early' | 'stable' | 'high-growth'
  monthlyIncome: number
  yearsRunning: number
  capitalInvested: number
  fullTime: boolean
}

export interface EducationPlan {
  targetLevel: string
  remainingYears: number
  totalYears: number
  mode: 'full-time' | 'part-time'
}

export type ChildStage =
  | 'infancy'
  | 'early-childhood'
  | 'school-age'
  | 'adolescence'
  | 'young-adult'
  | 'independent'

export interface ChildState {
  id: string
  /** Calendar year the child arrived (birth or adoption). */
  arrivalYear: number
  adopted: boolean
  age: number
  stage: ChildStage
  educationStage: 'pre' | 'primary' | 'secondary' | 'tertiary' | 'done'
  /** Placeholder burden bands — affect cost and time, never a diagnosis. */
  healthBurden: 'none' | 'mild' | 'significant'
  livingWithUser: boolean
}

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
  /** Members of the household at this point (incl. the user). */
  householdSize: number
  /** People contributing wage/business income. */
  incomeEarners: number
  /** Partner's nominal monthly income (0 when single). */
  partnerMonthlyIncome: number
  /** Family-care requirement level (0–2). */
  careLevel: number
  /** Who shares the home at this point (compact composition for the UI). */
  household: { partnerAge: number | null; childAges: number[] }
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
