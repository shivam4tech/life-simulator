import type { PersonProfile } from '@/domain/person'
import { isKnown, resolveMaybe } from '@/domain/values'
import { getCountryProfile } from '@/data/countries'
import {
  countryMedianIncome,
  ECONOMIC_ASSUMPTIONS,
  seniorityIndexFromId,
} from './assumptions'
import { clamp, logNormal, rngForLife, uniformInt } from './rng'
import { generatePartner } from './domains'
import type { ChildState, LifeState, SimulationConfig } from './types'

/**
 * Initial-state construction: PersonProfile → LifeState.
 *
 * Unknown values are sampled from plausible distributions using a per-life
 * sub-seed (tag-scoped), so each Monte Carlo life draws its own plausible
 * starting point while remaining fully reproducible. Known user values always
 * anchor the corresponding state.
 */

export class ProfileNotSimulatableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProfileNotSimulatableError'
  }
}

const DEFAULT_BEHAVIOUR = 5

const behaviour = (profile: PersonProfile) => {
  const b = profile.behaviours ?? {}
  return {
    riskTolerance: b.riskTolerance ?? DEFAULT_BEHAVIOUR,
    discipline: b.discipline ?? DEFAULT_BEHAVIOUR,
    patience: b.patience ?? DEFAULT_BEHAVIOUR,
    persistence: b.persistence ?? DEFAULT_BEHAVIOUR,
    adaptability: b.adaptability ?? DEFAULT_BEHAVIOUR,
    sociability: b.sociability ?? DEFAULT_BEHAVIOUR,
    stressTolerance: b.stressTolerance ?? DEFAULT_BEHAVIOUR,
    noveltySeeking: b.noveltySeeking ?? DEFAULT_BEHAVIOUR,
    careerAmbition: b.careerAmbition ?? DEFAULT_BEHAVIOUR,
    financialRestraint: b.financialRestraint ?? DEFAULT_BEHAVIOUR,
    familyOrientation: b.familyOrientation ?? DEFAULT_BEHAVIOUR,
    geographicMobility: b.geographicMobility ?? DEFAULT_BEHAVIOUR,
    learningInclination: b.learningInclination ?? DEFAULT_BEHAVIOUR,
    entrepreneurialTendency: b.entrepreneurialTendency ?? DEFAULT_BEHAVIOUR,
  }
}

const mapEmployment = (
  status: PersonProfile['employment'] extends undefined ? never : NonNullable<
    NonNullable<PersonProfile['employment']>['status']
  >,
): LifeState['employment'] => {
  switch (status) {
    case 'student':
      return 'student'
    case 'unemployed':
      return 'unemployed'
    case 'employed':
      return 'employed'
    case 'self-employed':
    case 'business-owner':
      return 'self-employed'
    case 'informal':
      return 'informal'
    case 'gig-freelance':
      return 'gig'
    case 'retired':
      return 'retired'
    default:
      // caregiver / unable-to-work / other → treat as out of formal employment
      return 'unemployed'
  }
}

const expectedMonthlyIncome = (
  country: NonNullable<ReturnType<typeof getCountryProfile>>,
  occupationFamily: LifeState['occupationFamily'],
  seniorityIndex: number,
  educationLevel: string | undefined,
  settlement: LifeState['settlement'],
): number => {
  const settlementWage =
    country.assumptions.incomeLevel > 0 ? settlementFactor(country, settlement) : 1
  const occupation = ECONOMIC_ASSUMPTIONS.occupationMultiplier[occupationFamily] ?? 0.9
  const seniority = ECONOMIC_ASSUMPTIONS.seniorityMultiplier[seniorityIndex] ?? 1
  const education =
    ECONOMIC_ASSUMPTIONS.educationMultiplier[
      (educationLevel ?? 'upper-secondary') as keyof typeof ECONOMIC_ASSUMPTIONS.educationMultiplier
    ] ?? 1
  return (
    countryMedianIncome(country) *
    settlementWage *
    occupation *
    seniority *
    education
  )
}

const settlementFactor = (
  country: NonNullable<ReturnType<typeof getCountryProfile>>,
  settlement: LifeState['settlement'],
): number => {
  // Placeholder wage premia; imported lazily to avoid a domain → sim cycle.
  const factors: Record<string, number> = {
    rural: 0.78,
    'small-town': 0.85,
    'secondary-city': 0.95,
    'major-city': 1.12,
    'global-city': 1.3,
  }
  void country
  return factors[settlement] ?? 1
}

/** Build the initial LifeState for one deterministic life. */
export const initialiseLife = (
  profile: PersonProfile,
  config: SimulationConfig,
  lifeSeed: number,
): LifeState => {
  const country = getCountryProfile(profile.demographics.countryOfResidence)
  if (!country) {
    throw new ProfileNotSimulatableError(
      `Unknown country "${profile.demographics.countryOfResidence}" — profiles need a supported country of residence.`,
    )
  }

  const rng = (tag: string) => rngForLife(lifeSeed, tag)
  const employment = profile.employment ?? {}
  const finances = profile.finances ?? {}
  const education = profile.education ?? {}
  const health = profile.health ?? {}
  const household = profile.household ?? {}
  const constraints = profile.constraints ?? {}

  // --- age ---
  const knownAge = resolveMaybe(profile.demographics.age)
  const age = knownAge !== null ? knownAge : uniformInt(rng('age'), 22, 58)

  // --- career ---
  const occupationFamily = employment.occupationFamily ?? 'other'
  const seniorityIndex = seniorityIndexFromId(employment.seniority)
  const yearsExperience =
    employment.yearsExperience && isKnown(employment.yearsExperience)
      ? Math.max(0, employment.yearsExperience.value)
      : Math.max(0, age - 22)

  const expectedIncome = expectedMonthlyIncome(
    country,
    occupationFamily,
    seniorityIndex,
    education.level,
    profile.demographics.settlementType ?? 'major-city',
  )

  // Personal income anchor: user value wins; unknown → log-normal spread around 1.
  const knownIncome = employment.grossIncome?.kind === 'known' ? employment.grossIncome.value : undefined
  const incomeMonthly =
    knownIncome !== undefined
      ? knownIncome.period === 'year'
        ? knownIncome.value / 12
        : knownIncome.value
      : 0
  const incomeMultiplier =
    knownIncome !== undefined
      ? clamp(incomeMonthly / Math.max(expectedIncome, 1), 0.15, 6)
      : logNormal(rng('income'), 1, 0.35 + country.assumptions.inequality * 0.3)

  // --- employment status & studying ---
  const startEmployment = mapEmployment(employment.status ?? (education.currentlyStudying ? 'student' : 'employed'))
  const studentAtStart = startEmployment === 'student'
  const graduationAge = studentAtStart
    ? age + Math.max(1, 4 - Math.floor(yearsExperience / 2))
    : undefined

  // --- finances ---
  const median = countryMedianIncome(country)
  const resolveMoney = (field: typeof finances.savings, fallbackMedianShare: number, tag: string): number => {
    if (field?.kind === 'known') {
      const value = field.value.period === 'year' ? field.value.value / 12 : field.value.value
      return Math.max(0, value)
    }
    if (field?.kind === 'range') return Math.max(0, (field.min + field.max) / 2)
    return logNormal(rng(tag), median * fallbackMedianShare, 0.7)
  }

  const savings = resolveMoney(finances.savings, 3.2, 'savings')
  const investments = resolveMoney(finances.investments, 1.8, 'investments')
  const debt = resolveMoney(finances.debt, 1.1, 'debt')
  const assets = resolveMoney(finances.majorAssets, 2.5, 'assets')

  const costBase = median * ECONOMIC_ASSUMPTIONS.singleAdultCostShare * countryPriceFactor(country)
  const knownExpenses = finances.essentialMonthlyExpenses?.kind === 'known' ? finances.essentialMonthlyExpenses.value : undefined
  const expensesMonthlyKnown =
    knownExpenses !== undefined ? (knownExpenses.period === 'year' ? knownExpenses.value / 12 : knownExpenses.value) : undefined
  const costMultiplier =
    expensesMonthlyKnown !== undefined
      ? clamp(expensesMonthlyKnown / Math.max(costBase, 1), 0.2, 5)
      : logNormal(rng('costs'), 1, 0.3)

  // --- relationships & household ---
  const dependentsKnown = profile.dependents?.count?.kind === 'known' ? profile.dependents.count.value : undefined
  const partnered = ['dating', 'committed', 'cohabiting', 'married'].includes(
    profile.relationshipStatus ?? '',
  )
  const childCount = dependentsKnown ?? 0
  const children: ChildState[] = []
  for (let i = 0; i < childCount; i++) {
    const childAge = Math.max(0, uniformInt(rng(`child${i}`), 1, 15))
    children.push({
      id: `c-init-${lifeSeed.toString(36)}-${i}`,
      arrivalYear: (config.startCalendarYear ?? 2026) - childAge,
      adopted: false,
      age: childAge,
      stage:
        childAge < 2
          ? 'infancy'
          : childAge < 6
            ? 'early-childhood'
            : childAge < 13
              ? 'school-age'
              : childAge < 19
                ? 'adolescence'
                : 'young-adult',
      educationStage: childAge < 5 ? 'pre' : childAge < 12 ? 'primary' : childAge < 18 ? 'secondary' : 'secondary',
      healthBurden: 'none',
      livingWithUser: true,
    })
  }
  const householdSize = household.size?.kind === 'known' ? household.size.value : 1 + children.length + (partnered ? 1 : 0)

  // --- health ---
  const overall = health.overall?.kind === 'known' ? clamp(health.overall.value, 1, 5) : undefined
  const healthIndex = overall !== undefined ? 30 + overall * 13 : 72
  const alcoholBand = { none: 0, light: 1, moderate: 2, heavy: 3 } as Record<string, number>

  const educationMultiplier =
    ECONOMIC_ASSUMPTIONS.educationMultiplier[
      (education.level ?? 'upper-secondary') as keyof typeof ECONOMIC_ASSUMPTIONS.educationMultiplier
    ] ?? 1

  const state: LifeState = {
    country,
    settlement: profile.demographics.settlementType ?? 'major-city',
    scenario: config.worldScenario,
    chaosLevel: config.chaosLevel ?? 'realistic',
    educationMultiplier,
    behaviours: behaviour(profile),
    goals: profile.goals ?? {},
    constraints: {
      cannotRelocate: constraints.cannotRelocate ?? false,
      unwillingInternational: constraints.unwillingToRelocateInternationally ?? false,
      careObligations: constraints.familyCareObligations ?? household.hasCareObligations ?? false,
      debtObligations: constraints.debtObligations ?? false,
    },
    sex: profile.demographics.sex,

    age,
    calendarYear: config.startCalendarYear ?? 2026,
    yearsExperience,
    inflationIndex: 1,

    employment: studentAtStart ? 'student' : startEmployment,
    occupationFamily,
    seniorityIndex,
    monthlyIncome: studentAtStart ? incomeMultiplier * expectedIncome * 0.25 : incomeMultiplier * expectedIncome,
    incomeMultiplier,
    skillLevel: clamp(35 + yearsExperience * 1.6, 0, 95),
    jobStability: employment.jobStability?.kind === 'known' ? employment.jobStability.value : 6,
    careerSatisfaction: employment.careerSatisfaction?.kind === 'known' ? employment.careerSatisfaction.value : 6,
    yearsInJob: Math.min(yearsExperience, 6),
    unemployedYears: startEmployment === 'unemployed' ? 1 : 0,
    graduationAge,
    pendingEducationLevel: studentAtStart ? (education.level ?? 'bachelor') : undefined,

    savings,
    investments,
    assets,
    debt,
    costMultiplier,
    sendsSupport: household.sendsFamilySupport ?? false,
    supportShare: household.sendsFamilySupport ? 0.08 : 0,

    relationship: profile.relationshipStatus ?? 'single',
    relationshipYears: partnered ? 3 : 0,
    relationshipSatisfaction: 6.5,
    relationshipStability: 6,
    sharedFinancialPressure: debt > 0 ? 5 : 3,
    timePressure: 3,
    partner: null, // generated below, once the state (behaviours, country) exists
    children,
    householdSize: Math.max(1, householdSize),
    childSupportMonthly: 0,
    careLevel: constraints.familyCareObligations ?? household.hasCareObligations ? (age >= 45 ? 1 : 0) : 0,
    desiredChildren: profile.relationshipPreferences?.desiredNumberOfChildren?.kind === 'known'
      ? profile.relationshipPreferences.desiredNumberOfChildren.value
      : undefined,
    childrenPreference: profile.relationshipPreferences?.childrenPreference,
    opennessToAdoption: profile.relationshipPreferences?.opennessToAdoption ?? false,
    desiresPartnership: profile.relationshipPreferences?.desiresPartnership ?? 'unsure',
    marriagePreference: profile.relationshipPreferences?.marriagePreference,

    healthIndex,
    chronicCondition: false,
    temporaryLimitationYears: 0,
    lifestyle: {
      activity: health.activity?.kind === 'known' ? health.activity.value : 5,
      sleep: health.sleepQuality?.kind === 'known' ? health.sleepQuality.value : 5,
      smoking: health.smoking ?? false,
      alcoholBand: health.alcohol ? (alcoholBand[health.alcohol] ?? 0) : 0,
      healthcareAccess: health.healthcareAccess?.kind === 'known'
        ? clamp(health.healthcareAccess.value / 10, 0.05, 1)
        : clamp(country.assumptions.healthcareAccess, 0.05, 1),
    },

    // Unknown language skill models as a spread around mid-low (documented).
    languageFit: clamp(logNormal(rng('language'), 0.42, 0.3), 0.1, 0.85),
    originCountry: country.identity.code,
    migration: null,
    worldRegime: 'normal',
    educationLevelKey: education.level,
    network: clamp(28 + yearsExperience * 1.4, 5, 92),
    careerCapital: clamp(22 + yearsExperience * 1.7 + (35 + yearsExperience * 1.6) * 0.18, 5, 96),
    managementSkill: seniorityIndex >= 4 ? 5 : seniorityIndex >= 2 ? 2 : 0.5,
    business: null,
    educationPlan: null,
    retrainingYearsLeft: 0,
    learningBoostYears: 0,
    jobHuntBoostYears: 0,
    jobHuntTargetIncrease: 0,
    savingsRateDelta: 0,
    hoursDelta: 0,
    forcedChildAttemptYears: 0,

    annualExpenses: 0,
    goalAlignment: 0.5,
  }

  // Partner at start uses the same deterministic generation as any meeting
  // (year −1 tag = "initial partner"), so replays reproduce them exactly.
  if (partnered) {
    const partner = generatePartner(state, lifeSeed, -1)
    if (partner.employment === 'unemployed' || partner.employment === 'inactive') {
      partner.monthlyIncome = 0
    } else {
      partner.monthlyIncome = countryMedianIncome(country) * partner.incomeMultiplier
    }
    state.partner = partner
  }

  return state
}

const countryPriceFactor = (country: NonNullable<ReturnType<typeof getCountryProfile>>): number =>
  0.4 + country.assumptions.priceLevel * 1.1
