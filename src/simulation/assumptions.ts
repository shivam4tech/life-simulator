/**
 * Simulation assumptions registry.
 *
 * ⚠️ Every coefficient here is a PLACEHOLDER modelling assumption, invented for
 * plausible relative behaviour — not observed statistics. They exist so the
 * engine has honest, centralised, traceable constants that real datasets can
 * replace per-value later (Sprint 7/9) without hunting magic numbers.
 *
 * Money semantics: the engine works in the profile's local currency. Absolute
 * levels are anchored to a country baseline derived from the (placeholder)
 * CountryProfile assumptions; user-entered amounts always anchor personal
 * values directly.
 */

import type { CountryProfile } from '@/domain/country'
import type { EducationLevel, OccupationFamily, Seniority } from '@/domain/taxonomies'
import type { WorldScenario } from './types'

export const ECONOMIC_ASSUMPTIONS = {
  /** Monthly median labour income of the abstract global reference economy. */
  referenceMedianIncome: 1000,
  /** Country income level (0–1) → baseline median income curve exponent. */
  incomeLevelExponent: 1.2,
  /** Occupational gross-income multiplier vs the country baseline. */
  occupationMultiplier: {
    administration: 0.85,
    agriculture: 0.55,
    'arts-media': 0.8,
    business: 1.1,
    construction: 0.9,
    education: 0.85,
    engineering: 1.35,
    finance: 1.35,
    healthcare: 1.2,
    hospitality: 0.65,
    'law-public-policy': 1.3,
    manufacturing: 0.85,
    'sales-marketing': 0.9,
    'science-research': 1.15,
    'skilled-trades': 0.95,
    technology: 1.55,
    'transport-logistics': 0.8,
    'service-work': 0.6,
    'military-security': 0.9,
    other: 0.9,
  } as Record<OccupationFamily, number>,
  /** Seniority multiplier ladder (index aligned with SENIORITY_LEVELS). */
  seniorityMultiplier: [0.45, 0.68, 1.0, 1.42, 1.85, 2.3, 2.9],
  /** Education modifier on expected income. */
  educationMultiplier: {
    none: 0.72,
    primary: 0.78,
    'lower-secondary': 0.85,
    'upper-secondary': 1.0,
    vocational: 1.05,
    'short-cycle-tertiary': 1.12,
    bachelor: 1.28,
    master: 1.45,
    doctorate: 1.6,
    'professional-certification': 1.2,
    other: 0.95,
  } as Record<EducationLevel, number>,
  /** Real wage growth per year by career phase (compounds separately from inflation). */
  experienceGrowth: {
    early: 0.042, // first 12 years
    mid: 0.018, // 12–28 years
    late: 0.005, // beyond
  },
  /** Household cost scaling exponent (economies of scale in a household). */
  householdScaleExponent: 0.62,
  /** Essential costs for a single adult as a share of the country median income (at price level 1). */
  singleAdultCostShare: 0.58,
  /** Per-child monthly cost as a share of the country median income, by stage factor. */
  childCostShareOfMedian: 0.2,
  /** Annual debt service rate (interest + principal) while debt exists. */
  debtServiceRate: 0.12,
  /** Share of any positive cash flow automatically invested vs kept liquid. */
  investShareBase: 0.45,
} as const

export const CAREER_ASSUMPTIONS = {
  /** Yearly promotion probability at baseline, scaled by modifiers. */
  promotionBase: 0.09,
  promotionSalaryBump: [1.08, 1.22] as const,
  /** Voluntary job change baseline (scales with mobility/dissatisfaction). */
  jobChangeBase: 0.07,
  jobChangeSalaryRange: [1.03, 1.28] as const,
  /** Yearly job-loss baseline in stable conditions (× sector/age/macro). */
  jobLossBase: 0.045,
  /** Yearly re-employment chance baseline while unemployed (× labour/skills/duration decay). */
  reemploymentBase: 0.5,
  reemploymentDecayPerYear: 0.82,
  /** Real income penalty after a long unemployment gap. */
  gapPenaltyMax: 0.28,
  /** Retirement hazard per year from 60, ramping up; hard stop at 80. */
  retirementStartAge: 60,
  retirementHazardBase: 0.08,
  retirementHazardRamp: 0.035,
  /** Pension as a share of country median income × safety-net strength. */
  pensionShareOfMedian: 0.42,
} as const

export const RELATIONSHIP_ASSUMPTIONS = {
  /** Yearly chance a single person starts dating, at the demographic peak. */
  datingBaseAtPeak: 0.16,
  datingPeakAge: 28,
  datingRange: [18, 68] as const,
  datingToCommitted: 0.4,
  committedToCohabiting: 0.22,
  cohabitingToMarried: 0.13,
  /** Separation hazard multipliers feed off satisfaction and stress. */
  separationBase: 0.05,
  divorceBase: 0.022,
  /** Yearly widowhood base for a partnered person (× age factor³). */
  widowhoodBase: 0.0012,
  /** Partner participation + income share of local median. */
  partnerEmploymentRate: 0.68,
  partnerIncomeShareOfMedian: 0.85,
} as const

export const FAMILY_ASSUMPTIONS = {
  /** Yearly first/next-child chance while partnered, inside fertility window. */
  birthBasePartnered: 0.15,
  birthBaseSingle: 0.035,
  fertilityWindow: [18, 45] as const,
  /** When the user already has this many more than desired, births go near zero. */
  overDesiredSuppression: 0.15,
  childStageShares: { infancy: 1.0, early: 1.0, school: 1.15, adolescent: 0.95, youngAdult: 0.55 } as Record<string, number>,
} as const

export const HEALTH_ASSUMPTIONS = {
  /** Yearly health-index drift by age band (before lifestyle). */
  driftUnder40: -0.15,
  drift40to60: -0.55,
  drift60plus: -1.3,
  /** Yearly event probabilities. */
  mildEventBase: 0.09,
  majorEventBase: 0.006,
  majorEventAgeFactor: 1.06, // compounds per year of age over 40
  /** Major-event out-of-pocket cost as a share of annual income, scaled by 1−access. */
  majorEventCostShareOfIncome: 1.4,
  mildEventCostShareOfIncome: 0.06,
} as const

/** World scenario regimes — external conditions, not personal fortunes. */
export interface ScenarioAssumptions {
  label: string
  growthMean: number // real GDP-ish drift
  growthVol: number
  inflationMean: number
  inflationVol: number
  inflationSpikeChance: number
  recessionChance: number
  /** Investment real return in normal years. */
  realReturnMean: number
  realReturnVol: number
  recessionReturn: number
}

export const WORLD_SCENARIOS: Record<WorldScenario, ScenarioAssumptions> = {
  optimistic: {
    label: 'Optimistic',
    growthMean: 0.035,
    growthVol: 0.012,
    inflationMean: 0.02,
    inflationVol: 0.008,
    inflationSpikeChance: 0.02,
    recessionChance: 0.04,
    realReturnMean: 0.052,
    realReturnVol: 0.09,
    recessionReturn: -0.16,
  },
  stable: {
    label: 'Stable',
    growthMean: 0.018,
    growthVol: 0.015,
    inflationMean: 0.027,
    inflationVol: 0.013,
    inflationSpikeChance: 0.04,
    recessionChance: 0.08,
    realReturnMean: 0.04,
    realReturnVol: 0.1,
    recessionReturn: -0.2,
  },
  difficult: {
    label: 'Difficult',
    growthMean: 0.002,
    growthVol: 0.02,
    inflationMean: 0.075,
    inflationVol: 0.035,
    inflationSpikeChance: 0.1,
    recessionChance: 0.18,
    realReturnMean: 0.025,
    realReturnVol: 0.13,
    recessionReturn: -0.24,
  },
  volatile: {
    label: 'Volatile',
    growthMean: 0.015,
    growthVol: 0.035,
    inflationMean: 0.085,
    inflationVol: 0.07,
    inflationSpikeChance: 0.16,
    recessionChance: 0.15,
    realReturnMean: 0.03,
    realReturnVol: 0.21,
    recessionReturn: -0.3,
  },
}

/** How much each occupation family is exposed to recessions (relative). */
export const SECTOR_RECESSION_EXPOSURE: Partial<Record<OccupationFamily, number>> = {
  healthcare: 0.55,
  education: 0.7,
  administration: 0.7,
  'military-security': 0.7,
  agriculture: 0.95,
  technology: 1.05,
  'science-research': 1.0,
  'transport-logistics': 1.15,
  manufacturing: 1.25,
  finance: 1.35,
  business: 1.2,
  construction: 1.45,
  hospitality: 1.55,
  'arts-media': 1.45,
  'service-work': 1.2,
  'sales-marketing': 1.2,
  'skilled-trades': 1.2,
}

export const ASSUMPTIONS_PROVENANCE = {
  source: 'internal placeholder model',
  confidence: 'placeholder' as const,
  note: 'Engine coefficients are invented for plausible dynamics. Real datasets replace them per-value without changing the engine API.',
}

/** Resolve the country baseline monthly median income from placeholder assumptions. */
export const countryMedianIncome = (country: CountryProfile): number =>
  ECONOMIC_ASSUMPTIONS.referenceMedianIncome *
  Math.pow(country.assumptions.incomeLevel, ECONOMIC_ASSUMPTIONS.incomeLevelExponent)

/** Seniority index helper (0..6 aligned with SENIORITY_LEVELS). */
export const seniorityIndexFromId = (seniority: Seniority | undefined): number => {
  switch (seniority) {
    case 'entry':
      return 0
    case 'junior':
      return 1
    case 'mid':
      return 2
    case 'senior':
      return 3
    case 'lead':
      return 4
    case 'management':
      return 5
    case 'executive-specialist':
      return 6
    default:
      return 2
  }
}
