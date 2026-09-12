import type { MaybeValue } from './values'
import type {
  EducationLevel,
  EmploymentStatus,
  HousingState,
  OccupationFamily,
  RelationshipStatus,
  ResidencyStatus,
  Seniority,
  SettlementType,
} from './taxonomies'
import type { MoneyAmount } from './money'

/**
 * PersonProfile — the starting state from which possible lives are simulated.
 *
 * Design rules:
 *  - Nothing is required beyond the core identity; an incomplete profile is valid.
 *  - Uncertain quantities use MaybeValue (known / range / unknown / N/A / prefer-not).
 *  - Behaviours and goals are self-assessed 0–10 inputs, never moral judgements.
 *  - Country-specific degree/job titles belong in descriptive free text only.
 */

export type MaybeMoney = MaybeValue<MoneyAmount>

export type Sex = 'female' | 'male' | 'intersex' | 'other' | 'prefer-not-to-answer'

export interface Demographics {
  /** Age in whole years. */
  age: MaybeValue<number>
  sex?: Sex
  /** ISO 3166-1 alpha-2 country code of current residence. */
  countryOfResidence: string
  /** ISO 3166-1 alpha-2 codes. */
  citizenships: string[]
  residencyStatus?: ResidencyStatus
  region?: string
  city?: string
  settlementType?: SettlementType
}

export interface Household {
  /** People living in the household, including the person. */
  size?: MaybeValue<number>
  livingWithFamily?: boolean
  /** Financial support the person sends to family outside the household. */
  sendsFamilySupport?: boolean
  /** Financial support the person receives from family. */
  receivesFamilySupport?: boolean
  /** Elders or others the person helps care for. */
  hasCareObligations?: boolean
}

export interface Education {
  level?: EducationLevel
  /** Free-text local qualification name (descriptive metadata only). */
  localQualificationName?: string
  field?: string
  currentlyStudying?: boolean
  yearsSinceCompletion?: MaybeValue<number>
  /** Self-assessed 0–10 willingness to study or retrain. */
  retrainingWillingness?: MaybeValue<number>
}

export interface Employment {
  status?: EmploymentStatus
  occupationFamily?: OccupationFamily
  industry?: string
  seniority?: Seniority
  yearsExperience?: MaybeValue<number>
  /** Income before tax/deductions, in local currency. */
  grossIncome?: MaybeMoney
  hoursPerWeek?: MaybeValue<number>
  /** Self-assessed 0–10: expectation of keeping this job. */
  jobStability?: MaybeValue<number>
  /** Self-assessed 0–10. */
  careerSatisfaction?: MaybeValue<number>
  remoteCompatible?: boolean
  entrepreneurialInterest?: MaybeValue<number>
}

export interface Finances {
  savings?: MaybeMoney
  investments?: MaybeMoney
  debt?: MaybeMoney
  /** Recurring housing cost (rent, mortgage payment, or household share). */
  housingCost?: MaybeMoney
  essentialMonthlyExpenses?: MaybeMoney
  discretionaryMonthlySpending?: MaybeMoney
}

export interface Housing {
  state?: HousingState
}

export interface Dependents {
  count?: MaybeValue<number>
  /** Free-text context (ages, relationship, care needs). */
  notes?: string
}

export interface Health {
  /** Self-assessed 1–5 overall health. Simulation input, not a medical judgement. */
  overall?: MaybeValue<number>
  /** Self-assessed 0–10 activity level. */
  activity?: MaybeValue<number>
  sleepQuality?: MaybeValue<number>
  smoking?: boolean
  healthcareAccess?: MaybeValue<number>
  /** Optional free-text long-term constraints the person wants modelled. */
  longTermConstraints?: string
}

/**
 * Self-assessed behavioural tendencies, each 0–10.
 * These modify simulation dynamics; none is a virtue or a flaw.
 */
export interface BehaviourProfile {
  riskTolerance?: number
  discipline?: number
  patience?: number
  persistence?: number
  adaptability?: number
  sociability?: number
  stressTolerance?: number
  noveltySeeking?: number
  careerAmbition?: number
  financialRestraint?: number
  familyOrientation?: number
  geographicMobility?: number
  learningInclination?: number
  entrepreneurialTendency?: number
}

export const BEHAVIOUR_KEYS = [
  'riskTolerance',
  'discipline',
  'patience',
  'persistence',
  'adaptability',
  'sociability',
  'stressTolerance',
  'noveltySeeking',
  'careerAmbition',
  'financialRestraint',
  'familyOrientation',
  'geographicMobility',
  'learningInclination',
  'entrepreneurialTendency',
] as const

export type GoalKey =
  | 'wealth'
  | 'financialSecurity'
  | 'career'
  | 'family'
  | 'romance'
  | 'children'
  | 'health'
  | 'knowledge'
  | 'prestige'
  | 'freedom'
  | 'adventure'
  | 'creativity'
  | 'community'
  | 'spirituality'
  | 'leisure'
  | 'contribution'

export const GOAL_KEYS: readonly GoalKey[] = [
  'wealth',
  'financialSecurity',
  'career',
  'family',
  'romance',
  'children',
  'health',
  'knowledge',
  'prestige',
  'freedom',
  'adventure',
  'creativity',
  'community',
  'spirituality',
  'leisure',
  'contribution',
]

export const GOAL_LABELS: Record<GoalKey, string> = {
  wealth: 'Wealth',
  financialSecurity: 'Financial security',
  career: 'Career',
  family: 'Family',
  romance: 'Romance',
  children: 'Children',
  health: 'Health',
  knowledge: 'Knowledge',
  prestige: 'Prestige',
  freedom: 'Freedom',
  adventure: 'Adventure',
  creativity: 'Creativity',
  community: 'Community',
  spirituality: 'Spirituality',
  leisure: 'Leisure',
  contribution: 'Contribution / purpose',
}

/** Goal importances, 0–10. They shape how futures are compared — never what happens. */
export type GoalWeights = Partial<Record<GoalKey, number>>

export interface Constraints {
  cannotRelocate?: boolean
  unwillingToRelocateInternationally?: boolean
  familyCareObligations?: boolean
  educationConstraints?: boolean
  debtObligations?: boolean
  healthLimitations?: boolean
  immigrationRestrictions?: boolean
  notes?: string
}

export interface PersonProfile {
  id: string
  /** Optional display label; profiles are not accounts and carry no personal data by default. */
  displayName?: string
  /** True for bundled fictional examples — must be surfaced in the UI. */
  isFictional?: boolean
  createdAt: string
  demographics: Demographics
  household?: Household
  education?: Education
  employment?: Employment
  finances?: Finances
  housing?: Housing
  dependents?: Dependents
  health?: Health
  behaviours?: BehaviourProfile
  relationshipStatus?: RelationshipStatus
  goals?: GoalWeights
  constraints?: Constraints
}
