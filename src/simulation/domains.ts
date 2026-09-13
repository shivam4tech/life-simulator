import type { ChildState, LifeState, PartnerState, SimEventDraft } from './types'
import { chance, clamp, normal, rngFor, uniform, uniformInt, weightedPick } from './rng'
import {
  CAREER_ASSUMPTIONS,
  countryMedianIncome,
  ECONOMIC_ASSUMPTIONS,
  FAMILY_ASSUMPTIONS,
  HEALTH_ASSUMPTIONS,
  RELATIONSHIP_ASSUMPTIONS,
} from './assumptions'
import { sectorExposure, type MacroYear } from './world'

const EDUCATION_RANK_LOOKUP: Record<string, number> = {
  none: 0,
  primary: 1,
  'lower-secondary': 2,
  'upper-secondary': 3,
  vocational: 3.5,
  'short-cycle-tertiary': 4,
  bachelor: 5,
  master: 6,
  doctorate: 7,
  'professional-certification': 4.5,
  other: 3,
}

/**
 * Domain stage functions — Sprint 5 adds persistent agents:
 *   - PartnerState: generated once per relationship from the meeting event's
 *     seed context; persists, ages, earns, retires, and carries preferences
 *     plus multidimensional compatibility with the user.
 *   - ChildState: persists from arrival to independence with stages, school,
 *     health-burden bands and living arrangement.
 *   - Household: partner income, custody support, care obligations and
 *     remittances all flow through the finance stage coherently.
 *
 * Each stage receives the mutable working state, the year's macro context and
 * its own deterministic RNG stream, and returns event drafts (the engine
 * assigns stable ids).
 */

const median = (state: LifeState) => countryMedianIncome(state.country)

const makeEvent = (_key: string, parts: SimEventDraft): SimEventDraft => parts

/* ------------------------------- CAREER --------------------------------- */

export interface CareerResult {
  events: SimEventDraft[]
  /** Applied income growth multiplier (nominal, before inflation). */
  incomeGrowth: number
}

export const careerTick = (state: LifeState, macro: MacroYear, lifeSeed: number, year: number): CareerResult => {
  const events: SimEventDraft[] = []
  let incomeGrowth = 1
  const rng = rngFor(lifeSeed, year, 'career')
  const exposure = sectorExposure(state)
  const labour = macro.labourFactor
  const ageFactor = state.age >= 62 ? 0.6 : 1

  if (state.employment === 'student') {
    if (state.graduationAge !== undefined && state.age >= state.graduationAge) {
      state.employment = 'unemployed' // short search before first job
      state.unemployedYears = 0
      state.monthlyIncome = Math.max(state.monthlyIncome, median(state) * 0.35 * state.educationMultiplier)
      events.push(
        makeEvent('grad', {
          year,
          age: state.age,
          domain: 'education',
          type: 'graduation',
          title: 'Completed studies',
          description: 'Finished the study programme and started looking for work.',
          severity: 'major',
          causes: ['+ study programme completed'],
        }),
      )
    }
    return { events, incomeGrowth }
  }

  if (state.employment === 'retired') {
    // Retired founders keep a quiet side income if the business survived.
    if (state.business && !state.business.fullTime) {
      state.business.monthlyIncome *= 1 + macro.inflation
    }
    return { events, incomeGrowth }
  }

  // --- entrepreneurship pathway (Sprint 6) ---
  if (state.business) {
    const businessEvents = businessTick(state, macro, rng, year)
    events.push(...businessEvents)
    if (state.business && state.business.fullTime) {
      state.monthlyIncome = Math.max(0, state.business.monthlyIncome)
    }
    if (!state.business) {
      // The business failed inside businessTick — path-dependent scars applied there.
      return { events, incomeGrowth }
    }
  }

  // --- job loss (employed / self-employed / informal / gig) ---
  const stabilityFactor = 1.25 - clamp(state.jobStability, 0, 10) * 0.09
  const informalityFactor = state.employment === 'informal' || state.employment === 'gig' ? 1.7 : 1
  const jobLossChance = clamp(
    CAREER_ASSUMPTIONS.jobLossBase * stabilityFactor * informalityFactor * exposure * ageFactor * (macro.recession ? 1.9 : 1),
    0.001,
    0.6,
  )
  if (chance(rng, jobLossChance)) {
    const severanceMonths = state.employment === 'informal' ? 0 : uniform(rng, 1, 3)
    const severance = state.monthlyIncome * severanceMonths
    state.savings += severance
    state.employment = 'unemployed'
    state.unemployedYears = 0
    state.yearsInJob = 0
    state.jobStability = clamp(state.jobStability - 1, 0, 10)
    state.careerSatisfaction = clamp(state.careerSatisfaction - 2, 0, 10)
    events.push(
      makeEvent('jobloss', {
        year,
        age: state.age,
        domain: 'career',
        type: 'job-loss',
        title: 'Lost job',
        description:
          severanceMonths > 0
            ? `Employment ended with about ${severanceMonths.toFixed(1)} months of severance.`
            : 'Employment ended without severance.',
        severity: 'major',
        causes: [
          ...(macro.recession ? ['- recession year', `- sector exposure ×${exposure.toFixed(2)}`] : []),
          state.jobStability < 5 ? '- low job stability' : '+ job stability',
          informalityFactor > 1 ? '- informal/gig work is less protected' : '',
        ].filter(Boolean),
      }),
    )
    return { events, incomeGrowth }
  }

  // --- re-employment while unemployed ---
  if (state.employment === 'unemployed') {
    const durationDecay = Math.pow(CAREER_ASSUMPTIONS.reemploymentDecayPerYear, state.unemployedYears)
    const skillFactor = 0.5 + state.skillLevel / 100
    const ageEmployFactor = state.age >= 58 ? 0.72 : 1
    const hireChance = clamp(
      CAREER_ASSUMPTIONS.reemploymentBase * labour * skillFactor * durationDecay * ageEmployFactor,
      0.02,
      0.95,
    )
    if (chance(rng, hireChance)) {
      const gapPenalty = state.unemployedYears >= 2 ? CAREER_ASSUMPTIONS.gapPenaltyMax * 0.6 : state.unemployedYears >= 1 ? 0.12 : 0
      const change = normal(rng, 1 - gapPenalty, 0.08)
      state.monthlyIncome = Math.max(state.monthlyIncome * change, median(state) * 0.2)
      state.incomeMultiplier *= change
      state.employment = 'employed'
      state.unemployedYears = 0
      state.yearsInJob = 0
      state.jobStability = clamp(state.jobStability + 1, 0, 10)
      events.push(
        makeEvent('hire', {
          year,
          age: state.age,
          domain: 'career',
          type: 're-employed',
          title: 'Found new job',
          description: `Re-entered employment${gapPenalty > 0.1 ? ' at a lower salary after the gap' : ''}.`,
          severity: 'major',
          causes: [
            '+ rehired after search',
            `+ labour market factor ${labour.toFixed(2)}`,
            state.unemployedYears >= 1 ? '- long unemployment gap reduced offers' : '',
          ].filter(Boolean),
        }),
      )
    } else {
      state.unemployedYears += 1
      state.skillLevel = clamp(state.skillLevel - 1.5, 0, 100)
    }
    return { events, incomeGrowth }
  }

  // --- employed: promotion / voluntary change / growth ---
  state.yearsInJob += 1
  state.yearsExperience += 1

  const phaseFactor = state.yearsExperience < 12 ? 1.3 : state.yearsExperience < 28 ? 1 : 0.6
  const ambitionFactor = 0.6 + state.behaviours.careerAmbition * 0.08
  const skillFactor = 0.6 + state.skillLevel / 125
  const capitalFactor = 0.85 + (state.careerCapital / 100) * 0.35
  const ceilingDrag = state.seniorityIndex >= 6 ? 0.3 : 1

  const promotionChance = clamp(
    CAREER_ASSUMPTIONS.promotionBase * phaseFactor * ambitionFactor * skillFactor * capitalFactor * labour * ceilingDrag * (macro.recession ? 0.45 : 1),
    0.001,
    0.5,
  )
  const dissatisfaction = clamp((7 - state.careerSatisfaction) / 7, 0, 1)
  const mobility = state.behaviours.geographicMobility / 10
  if (state.retrainingYearsLeft > 0) {
    state.retrainingYearsLeft -= 1
    incomeGrowth *= 0.85
    if (state.retrainingYearsLeft === 0) {
      state.skillLevel = clamp(state.skillLevel + 8, 0, 100)
      events.push(
        makeEvent('retraining', {
          year,
          age: state.age,
          domain: 'education',
          type: 'retraining-completed',
          title: 'Retraining completed',
          description: 'Finished retraining for the new field — skills sharpened, full pay resumes.',
          severity: 'notable',
          causes: ['+ retraining programme finished'],
        }),
      )
    }
  }

  const huntBoost = state.jobHuntBoostYears > 0 ? 1.9 : 1
  const jobChangeChance = clamp(
    CAREER_ASSUMPTIONS.jobChangeBase * (0.5 + dissatisfaction) * (0.6 + mobility) * labour * huntBoost * (macro.recession ? 0.5 : 1),
    0.001,
    0.45,
  )
  if (state.jobHuntBoostYears > 0) state.jobHuntBoostYears -= 1

  if (chance(rng, promotionChance)) {
    state.seniorityIndex = clamp(state.seniorityIndex + 1, 0, 6)
    const bump = uniform(rng, CAREER_ASSUMPTIONS.promotionSalaryBump[0], CAREER_ASSUMPTIONS.promotionSalaryBump[1])
    incomeGrowth *= bump
    state.jobStability = clamp(state.jobStability + 0.5, 0, 10)
    state.careerSatisfaction = clamp(state.careerSatisfaction + 1, 0, 10)
    state.skillLevel = clamp(state.skillLevel + 3, 0, 100)
    events.push(
      makeEvent('promo', {
        year,
        age: state.age,
        domain: 'career',
        type: 'promotion',
        title: 'Promotion',
        description: `Moved up a level; salary changed by about ${Math.round((bump - 1) * 100)}%.`,
        severity: 'notable',
        causes: [
          `+ ${Math.round(state.yearsExperience)} years experience`,
          `+ skill level ${Math.round(state.skillLevel)}`,
          `+ career ambition ${state.behaviours.careerAmbition}/10`,
          macro.recession ? '- recession suppressed openings' : '+ healthy labour market',
        ],
      }),
    )
  } else if (chance(rng, jobChangeChance)) {
    const hunted = state.jobHuntTargetIncrease > 0 && state.jobHuntBoostYears < 3
    const change = hunted
      ? Math.max(1 + state.jobHuntTargetIncrease * uniform(rng, 0.5, 1), normal(rng, 1.12, 0.08))
      : normal(rng, (CAREER_ASSUMPTIONS.jobChangeSalaryRange[0] + CAREER_ASSUMPTIONS.jobChangeSalaryRange[1]) / 2, 0.09)
    const clamped = clamp(change, 0.9, 1.45)
    if (hunted) state.jobHuntTargetIncrease = 0
    incomeGrowth *= clamped
    state.yearsInJob = 0
    state.careerSatisfaction = clamp(state.careerSatisfaction + 1.5, 0, 10)
    state.jobStability = clamp(state.jobStability - 0.5, 0, 10)
    events.push(
      makeEvent('jobchange', {
        year,
        age: state.age,
        domain: 'career',
        type: 'job-change',
        title: 'Changed employers',
        description: `Moved to a new employer; salary changed by about ${Math.round((clamped - 1) * 100)}%.`,
        severity: 'notable',
        causes: [
          dissatisfaction > 0.3 ? '- dissatisfaction with current role' : '+ opportunity seeking',
          `+ mobility openness ${Math.round(state.behaviours.geographicMobility)}/10`,
          `+ labour factor ${labour.toFixed(2)}`,
        ],
      }),
    )
  } else {
    const phase = state.yearsExperience < 12 ? 'early' : state.yearsExperience < 28 ? 'mid' : 'late'
    const baseRealGrowth = ECONOMIC_ASSUMPTIONS.experienceGrowth[phase]
    let realGrowth = baseRealGrowth * (0.7 + state.skillLevel / 250) * macro.wageGrowthFactor
    if (state.incomeMultiplier > 2.2) realGrowth *= 0.5
    if (state.incomeMultiplier < 0.7) realGrowth *= 1.3
    incomeGrowth *= 1 + realGrowth
  }

  // --- retirement consideration ---
  if (state.age >= CAREER_ASSUMPTIONS.retirementStartAge) {
    const ramp = (state.age - CAREER_ASSUMPTIONS.retirementStartAge) * CAREER_ASSUMPTIONS.retirementHazardRamp
    const runway = (state.savings + state.investments) / Math.max(state.annualExpenses, 1)
    const comfort = clamp(runway / 20, 0, 1)
    const retireChance = clamp((CAREER_ASSUMPTIONS.retirementHazardBase + ramp) * (0.4 + comfort), 0, 0.5)
    if (chance(rng, retireChance)) {
      state.employment = 'retired'
      events.push(
        makeEvent('retire', {
          year,
          age: state.age,
          domain: 'career',
          type: 'retirement',
          title: 'Retired',
          description: 'Left working life; income shifts to pension and savings drawdown.',
          severity: 'major',
          causes: [
            `+ age ${state.age}`,
            `+ financial runway ≈ ${Math.round(runway)} months`,
          ],
        }),
      )
    }
  }

  // --- skills, network, capital & satisfaction drift ---
  const learningBoost = state.behaviours.learningInclination * 0.35
  state.skillLevel = clamp(state.skillLevel + (0.8 + learningBoost) * (macro.recession ? 0.5 : 1) - (state.age > 65 ? 1 : 0), 0, 100)
  state.network = clamp(state.network + 1.2 * (0.5 + state.behaviours.sociability / 20) - (macro.recession ? 0.8 : 0), 0, 100)
  state.careerCapital = clamp(
    state.careerCapital + (0.9 + state.behaviours.persistence * 0.05) * (macro.recession ? 0.4 : 1),
    0,
    100,
  )
  if (state.seniorityIndex >= 4) state.managementSkill = clamp(state.managementSkill + 0.15, 0, 10)
  state.careerSatisfaction = clamp(state.careerSatisfaction + normal(rng, 0, 0.4), 0, 10)

  return { events, incomeGrowth }
}

/**
 * Business pathway: early-phase survival rolls, growth, plateau, and
 * failure with path-dependent scars (capital lost, debt, but management
 * experience and network gained — the "startup failed, founder improved" loop).
 */
const businessTick = (state: LifeState, macro: MacroYear, rng: () => number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const business = state.business!
  business.yearsRunning += 1

  if (business.phase === 'early') {
    // Growth roll (recession hurts young businesses badly).
    const growth = macro.recession ? normal(rng, 0.02, 0.18) : normal(rng, 0.28, 0.2)
    business.monthlyIncome = Math.max(0, business.monthlyIncome * (1 + growth))
    const runway = business.capitalInvested > 0 ? business.capitalInvested / Math.max(state.annualExpenses, 1) : 0
    const disciplineShield = 0.5 + state.behaviours.discipline * 0.05
    const failureChance = business.yearsRunning <= 2 ? 0.13 / disciplineShield : 0.07 / disciplineShield
    if (chance(rng, failureChance * (runway > 1.5 ? 0.7 : 1))) {
      failBusiness(state, events, year, rng)
      return events
    }
    if (business.yearsRunning >= 3 && chance(rng, 0.5)) {
      const breakout = chance(rng, 0.18)
      business.phase = breakout ? 'high-growth' : 'stable'
      if (breakout) {
        business.monthlyIncome *= 1.4
        events.push(
          makeEvent('breakout', {
            year,
            age: state.age,
            domain: 'career',
            type: 'business-breakout',
            title: 'Business breaking out',
            description: 'The business found real traction and is growing fast.',
            severity: 'notable',
            causes: ['+ survived the early phase', `+ sector applicability ${state.occupationFamily.replace(/-/g, ' ')}`],
          }),
        )
      } else {
        events.push(
          makeEvent('settle', {
            year,
            age: state.age,
            domain: 'career',
            type: 'business-stable',
            title: 'Business found its footing',
            description: 'The business stabilised into a going concern.',
            severity: 'notable',
            causes: ['+ three years of survival'],
          }),
        )
      }
    }
    return events
  }

  if (business.phase === 'high-growth') {
    business.monthlyIncome *= 1 + normal(rng, 0.3, 0.12)
    if (business.yearsRunning >= 6) business.phase = 'stable'
    return events
  }

  // stable: slow drift with occasional reinvestment; small failure risk remains
  business.monthlyIncome *= 1 + macro.inflation + normal(rng, 0.015, 0.06)
  if (chance(rng, 0.025)) {
    failBusiness(state, events, year, rng)
  }
  return events
}

const failBusiness = (
  state: LifeState,
  events: SimEventDraft[],
  year: number,
  rng: () => number,
): void => {
  const business = state.business!
  const lostCapital = business.capitalInvested * 0.6
  state.debt += lostCapital * 0.3
  state.business = null
  // Path dependence: money is gone, capability is not.
  state.careerCapital = clamp(state.careerCapital + 9, 0, 100)
  state.network = clamp(state.network + 10, 0, 100)
  state.managementSkill = clamp(state.managementSkill + 1.5, 0, 10)
  state.careerSatisfaction = clamp(state.careerSatisfaction - 2, 0, 10)
  if (business.fullTime) {
    state.employment = 'unemployed'
    state.unemployedYears = 0
  }
  events.push(
    makeEvent('bizfail', {
      year,
      age: state.age,
      domain: 'career',
      type: 'business-failure',
      title: 'Business closed',
      description: business.fullTime
        ? 'The business failed: capital lost, some debt taken on — but management experience and network remain.'
        : 'The side business failed: capital partly lost, lessons kept.',
      severity: 'major',
      causes: [
        '- early-phase survival risk',
        state.behaviours.discipline < 5 ? '- thin operating discipline' : '',
      ].filter(Boolean),
    }),
  )
  void rng
}

/* ------------------------------ PARTNERS -------------------------------- */

const OCCUPATION_WEIGHTS: { value: PartnerState['occupationFamily']; weight: number }[] = [
  { value: 'administration', weight: 10 },
  { value: 'agriculture', weight: 5 },
  { value: 'arts-media', weight: 4 },
  { value: 'business', weight: 9 },
  { value: 'construction', weight: 7 },
  { value: 'education', weight: 8 },
  { value: 'engineering', weight: 6 },
  { value: 'finance', weight: 6 },
  { value: 'healthcare', weight: 8 },
  { value: 'hospitality', weight: 7 },
  { value: 'law-public-policy', weight: 3 },
  { value: 'manufacturing', weight: 7 },
  { value: 'sales-marketing', weight: 8 },
  { value: 'science-research', weight: 3 },
  { value: 'skilled-trades', weight: 8 },
  { value: 'technology', weight: 7 },
  { value: 'transport-logistics', weight: 7 },
  { value: 'service-work', weight: 9 },
  { value: 'military-security', weight: 3 },
  { value: 'other', weight: 4 },
]

/**
 * Generate a persistent partner from the meeting context. Deliberately *not*
 * idealised: income draws below the user's on average, preferences can clash,
 * and nothing depends on gender or nationality.
 */
export const generatePartner = (
  state: LifeState,
  lifeSeed: number,
  year: number,
): PartnerState => {
  const rng = rngFor(lifeSeed, year, 'relationships')
  const tag = `p-${lifeSeed.toString(36)}-${year}`
  const ageGap = Math.round(normal(rng, 0, 3.8))
  const age = Math.max(18, Math.min(85, state.age + ageGap))

  const employedRoll = chance(rng, RELATIONSHIP_ASSUMPTIONS.partnerEmploymentRate)
  const employment: PartnerState['employment'] = employedRoll
    ? chance(rng, 0.12)
      ? 'self-employed'
      : 'employed'
    : chance(rng, 0.25)
      ? 'inactive'
      : 'unemployed'

  // Below-average income draw on purpose — partners are not prizes.
  const incomeMultiplier = clamp(Math.exp(normal(rng, Math.log(0.82), 0.42)), 0.1, 4)
  const monthlyIncome =
    employment === 'employed' || employment === 'self-employed'
      ? median(state) * incomeMultiplier * (0.9 + (settlementWage(state) - 1) * 0.6) * state.inflationIndex
      : 0

  // Children preference: usually aligned with the user's, but can disagree.
  const userPref = state.childrenPreference ?? 'unsure'
  const childrenPreference: PartnerState['childrenPreference'] =
    userPref === 'no'
      ? chance(rng, 0.25)
        ? 'unsure'
        : 'no'
      : userPref === 'yes'
        ? chance(rng, 0.2)
          ? 'unsure'
          : chance(rng, 0.1)
            ? 'no'
            : 'yes'
        : weightedPick(rng, [
            { value: 'unsure' as const, weight: 5 },
            { value: 'yes' as const, weight: 3 },
            { value: 'no' as const, weight: 2 },
          ])

  const riskTolerance = clamp(normal(rng, state.behaviours.riskTolerance, 2.2), 0, 10)
  const financialRestraint = clamp(normal(rng, state.behaviours.financialRestraint, 2.4), 0, 10)
  const careerAmbition = clamp(normal(rng, state.behaviours.careerAmbition, 2.2), 0, 10)

  const partner: PartnerState = {
    id: tag,
    age,
    educationLevel: 'upper-secondary',
    employment,
    occupationFamily: weightedPick(rng, OCCUPATION_WEIGHTS),
    incomeMultiplier,
    monthlyIncome,
    healthIndex: clamp(normal(rng, 74, 8), 30, 98),
    riskTolerance,
    financialRestraint,
    careerAmbition,
    sociability: clamp(normal(rng, state.behaviours.sociability, 2.4), 0, 10),
    childrenPreference,
    marriagePreference: weightedPick(rng, [
      { value: 'open' as const, weight: 6 },
      { value: 'important' as const, weight: 3 },
      { value: 'not-for-me' as const, weight: 3 },
    ]),
    migrationWillingness: clamp(normal(rng, 5, 2.5), 0, 10),
    compatibility: {
      values: clamp(normal(rng, 0.66, 0.16), 0.05, 1),
      children: childrenAlignment(userPref, childrenPreference),
      money: clamp(1 - Math.abs(state.behaviours.financialRestraint - financialRestraint) / 10, 0.05, 1),
      ambition: clamp(1 - Math.abs(state.behaviours.careerAmbition - careerAmbition) / 10, 0.05, 1),
      lifestyle: clamp(normal(rng, 0.64, 0.18), 0.05, 1),
    },
  }
  return partner
}

const settlementWage = (state: LifeState): number => {
  const factors: Record<string, number> = {
    rural: 0.78,
    'small-town': 0.85,
    'secondary-city': 0.95,
    'major-city': 1.12,
    'global-city': 1.3,
  }
  return factors[state.settlement] ?? 1
}

const childrenAlignment = (
  user: LifeState['childrenPreference'],
  partner: PartnerState['childrenPreference'],
): number => {
  if (user === 'prefer-not' || user === undefined) return 0.7
  if (user === partner) return 1
  if (user === 'unsure' || partner === 'unsure') return 0.62
  return 0.16 // direct yes/no clash
}

/** Overall compatibility, weighted by how much each dimension drives outcomes. */
export const partnerCompatibility = (partner: PartnerState): number => {
  const c = partner.compatibility
  return clamp(c.values * 0.3 + c.children * 0.3 + c.money * 0.2 + c.ambition * 0.1 + c.lifestyle * 0.1, 0, 1)
}

const compatibilityLabel = (overall: number): string =>
  overall >= 0.66 ? 'Strong alignment' : overall >= 0.42 ? 'Moderate alignment' : 'Major tension'

/* --------------------------- RELATIONSHIPS ------------------------------ */

const PARTNERED = ['dating', 'committed', 'cohabiting', 'married']

export const relationshipTick = (
  state: LifeState,
  lifeSeed: number,
  year: number,
): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'relationships')
  const partnered = PARTNERED.includes(state.relationship)
  state.relationshipYears += 1

  const wantsPartnership = state.desiresPartnership !== 'no'

  /* --- slow-moving dynamics (never year-to-year oscillation) --- */
  if (state.partner) {
    const compat = partnerCompatibility(state.partner)
    const target = 3.2 + compat * 5 + (state.sharedFinancialPressure > 6 ? -1 : 0)
    state.relationshipSatisfaction = clamp(
      state.relationshipSatisfaction + (target - state.relationshipSatisfaction) * 0.12 + normal(rng, 0, 0.35),
      0,
      10,
    )
    const stabilityTarget = 4 + compat * 5
    state.relationshipStability = clamp(
      state.relationshipStability + (stabilityTarget - state.relationshipStability) * 0.08 + normal(rng, 0, 0.2),
      0,
      10,
    )
  } else {
    state.relationshipSatisfaction = clamp(state.relationshipSatisfaction + normal(rng, 0, 0.3), 0, 10)
  }

  /* --- meeting someone --- */
  if (!partnered) {
    if (!wantsPartnership) return events
    const { datingBaseAtPeak, datingPeakAge, datingRange } = RELATIONSHIP_ASSUMPTIONS
    const distanceFromPeak = Math.abs(state.age - datingPeakAge)
    const ageCurve = clamp(1 - distanceFromPeak / ((datingRange[1] - datingRange[0]) / 1.6), 0.05, 1)
    const socialFactor = 0.4 + state.behaviours.sociability * 0.12
    const endedBadly = ['separated', 'divorced'].includes(state.relationship)
    const griefFactor = state.relationship === 'widowed' ? 0.4 : 1
    const recoveryFactor = endedBadly ? clamp(0.45 + state.relationshipYears * 0.08, 0.45, 0.9) : 1
    const careFactor = state.careLevel > 0 ? 0.8 : 1
    const startChance = clamp(
      datingBaseAtPeak * ageCurve * socialFactor * recoveryFactor * griefFactor * careFactor,
      0,
      0.5,
    )
    if (chance(rng, startChance)) {
      const partner = generatePartner(state, lifeSeed, year)
      state.partner = partner
      state.relationship = 'dating'
      state.relationshipYears = 0
      state.relationshipSatisfaction = clamp(normal(rng, 5 + partnerCompatibility(partner) * 3, 0.8), 0, 10)
      state.relationshipStability = 5
      state.sharedFinancialPressure = clamp(state.debt > state.monthlyIncome * 6 ? 6 : 3, 0, 10)
      if (partner.employment !== 'unemployed' && partner.employment !== 'inactive') {
        // Moving in comes later (progression); a new partner doesn't share a home yet.
      }
      events.push(
        makeEvent('met', {
          year,
          age: state.age,
          domain: 'relationships',
          type: 'relationship-start',
          title: 'Met a partner',
          description: `A new relationship began (${compatibilityLabel(partnerCompatibility(partner)).toLowerCase()} on the model's compatibility read).`,
          severity: 'notable',
          causes: [
            `+ sociability ${Math.round(state.behaviours.sociability)}/10`,
            '+ open to partnership',
            state.careLevel > 0 ? '- care obligations dampen social time' : '',
          ].filter(Boolean),
        }),
      )
    }
    return events
  }

  /* --- partnered: joint dynamics --- */
  const partner = state.partner
  const compat = partner ? partnerCompatibility(partner) : 0.5

  const incomeVsCosts =
    state.annualExpenses > 0
      ? ((state.monthlyIncome + (partner?.monthlyIncome ?? 0)) * 12) / state.annualExpenses
      : 1
  const pressureTarget = clamp(10 - incomeVsCosts * 5, 0, 10)
  state.sharedFinancialPressure = clamp(
    state.sharedFinancialPressure + (pressureTarget - state.sharedFinancialPressure) * 0.15 + normal(rng, 0, 0.3),
    0,
    10,
  )
  const timeTarget = clamp(
    2 +
      (state.employment === 'unemployed' ? -1 : 0) +
      state.children.filter((c) => c.age < 6 && c.livingWithUser).length * 2.2 +
      state.careLevel * 1.8 +
      state.hoursDelta / 3,
    0,
    10,
  )
  state.timePressure = clamp(
    state.timePressure + (timeTarget - state.timePressure) * 0.15 + normal(rng, 0, 0.3),
    0,
    10,
  )

  // A visible "stress period" once satisfaction stays low — not every year.
  if (state.relationshipSatisfaction < 3.2 && state.relationshipYears >= 2 && chance(rng, 0.3)) {
    events.push(
      makeEvent('stress', {
        year,
        age: state.age,
        domain: 'relationships',
        type: 'relationship-stress',
        title: 'Relationship stress period',
        description: 'Sustained strain: low satisfaction, pressure from money, time or clashing preferences.',
        severity: 'minor',
        causes: [
          state.sharedFinancialPressure > 5 ? '- shared financial pressure' : '',
          state.timePressure > 6 ? '- time pressure (children/care/work)' : '',
          compat < 0.45 ? '- compatibility tension' : '',
        ].filter(Boolean),
      }),
    )
  }

  // Widowhood (rare, rises sharply with the partner's age).
  if (partner) {
    const partnerAgeFactor = Math.pow(Math.max(0, partner.age - 45) / 10, 3)
    if (chance(rng, RELATIONSHIP_ASSUMPTIONS.widowhoodBase * (1 + partnerAgeFactor))) {
      state.relationship = 'widowed'
      state.partner = null
      state.relationshipYears = 0
      if (state.householdSize >= 2) state.householdSize -= 1
      state.relationshipSatisfaction = 2
      events.push(
        makeEvent('widow', {
          year,
          age: state.age,
          domain: 'relationships',
          type: 'widowhood',
          title: 'Partner passed away',
          description: 'The partnership ended through loss; the household lost a second income.',
          severity: 'major',
          causes: ['- partner age-related risk'],
        }),
      )
      return events
    }
  }

  // Breakdown: interacting factors, never a single cause.
  const satisfactionFactor = clamp(1.4 - state.relationshipSatisfaction / 8, 0.2, 2.2)
  const stabilityFactor = clamp(1.3 - state.relationshipStability / 8, 0.3, 1.9)
  const unemploymentStress =
    state.employment === 'unemployed' ? 1.35 : partner?.employment === 'unemployed' ? 1.2 : 1
  const debtStress = state.debt > state.monthlyIncome * 10 ? 1.3 : 1
  const childConflict = partner && partner.compatibility.children < 0.4 ? 1.25 : 1
  const timeStress = state.timePressure > 7 ? 1.25 : 1
  const isMarried = state.relationship === 'married'
  const breakChance = clamp(
    (isMarried ? RELATIONSHIP_ASSUMPTIONS.divorceBase : RELATIONSHIP_ASSUMPTIONS.separationBase) *
      satisfactionFactor *
      stabilityFactor *
      unemploymentStress *
      debtStress *
      childConflict *
      timeStress *
      (1 + (1 - compat) * 0.8),
    0,
    0.35,
  )
  if (chance(rng, breakChance)) {
    const goesToSeparated = isMarried && chance(rng, 0.4)
    endPartnership(state, goesToSeparated ? 'separated' : isMarried ? 'divorced' : 'single', events, year, rng)
    return events
  }

  // Post-separation divorce completion.
  if (state.relationship === 'separated' && chance(rng, 0.35)) {
    state.relationship = 'divorced'
    events.push(
      makeEvent('divorce', {
        year,
        age: state.age,
        domain: 'relationships',
        type: 'divorce',
        title: 'Divorce finalised',
        description: 'The legal end of the separation.',
        severity: 'notable',
        causes: ['- separation finalised'],
      }),
    )
    return events
  }

  // Progression — compatibility and both partners' attitudes gate it.
  const progression: Record<string, { next: string; chance: number }> = {
    dating: { next: 'committed', chance: RELATIONSHIP_ASSUMPTIONS.datingToCommitted },
    committed: { next: 'cohabiting', chance: RELATIONSHIP_ASSUMPTIONS.committedToCohabiting },
    cohabiting: { next: 'married', chance: RELATIONSHIP_ASSUMPTIONS.cohabitingToMarried },
  }
  const step = progression[state.relationship]
  if (step && partner) {
    let gate = 1
    if (step.next === 'married') {
      const userGate =
        state.marriagePreference === 'not-for-me' ? 0 : state.marriagePreference === 'important' ? 1.6 : 1
      const partnerGate =
        partner.marriagePreference === 'not-for-me' ? 0.15 : partner.marriagePreference === 'important' ? 1.5 : 1
      gate = userGate * partnerGate
    } else {
      gate = 0.6 + compat * 0.8
    }
    const timeGate = state.relationshipYears >= 1 ? 1 : 0
    if (gate > 0 && timeGate > 0 && chance(rng, step.chance * gate)) {
      const previous = state.relationship
      state.relationship = step.next as typeof state.relationship
      if (step.next === 'cohabiting' || step.next === 'married') {
        if (previous === 'dating' || previous === 'committed') {
          state.householdSize = Math.max(state.householdSize + 1, 2)
        }
      }
      events.push(
        makeEvent('progress', {
          year,
          age: state.age,
          domain: 'relationships',
          type: `relationship-${step.next}`,
          title:
            step.next === 'committed'
              ? 'Relationship became committed'
              : step.next === 'cohabiting'
                ? 'Moved in together'
                : 'Married / formalised partnership',
          description:
            step.next === 'married'
              ? `Formalised the partnership (${compatibilityLabel(compat).toLowerCase()}).`
              : 'The partnership moved to its next stage.',
          severity: 'notable',
          causes: [
            `+ relationship duration ${state.relationshipYears}y`,
            `+ ${compatibilityLabel(compat)}`,
            step.next === 'married'
              ? `+ attitudes: you ${state.marriagePreference ?? 'open'} / partner ${partner.marriagePreference}`
              : '',
          ].filter(Boolean),
        }),
      )
    }
  }

  return events
}

/** Apply the household + financial consequences of a partnership ending. */
const endPartnership = (
  state: LifeState,
  kind: 'separated' | 'divorced' | 'single',
  events: SimEventDraft[],
  year: number,
  rng: () => number,
) => {
  const partner = state.partner
  const previousStatus = state.relationship
  state.partner = null
  state.relationship = kind
  state.relationshipYears = 0
  state.relationshipSatisfaction = clamp(state.relationshipSatisfaction - 2, 0, 10)

  // Settlement: splitting a household is expensive.
  const settlementCost = state.monthlyIncome * normal(rng, 3, 1)
  state.savings = Math.max(0, state.savings - Math.max(0, settlementCost))

  // Custody (broad global placeholder): younger children usually stay with the user.
  const minorChildren = state.children.filter((child) => child.age < 18 && child.livingWithUser)
  const childrenStay = chance(rng, 0.7)
  let custodyNote = ''
  if (!childrenStay && minorChildren.length > 0) {
    for (const child of minorChildren) {
      child.livingWithUser = false
      state.householdSize = Math.max(1, state.householdSize - 1)
    }
    state.childSupportMonthly = state.monthlyIncome * 0.15 * minorChildren.length
    custodyNote = ' The children live with the other parent and support is paid.'
  } else if (minorChildren.length > 0) {
    custodyNote = ' The children live in this household.'
  }

  // The partner only leaves the household count if they were actually in it
  // (a married user who declared a one-person household keeps that floor).
  if (partner && state.householdSize >= 2) state.householdSize -= 1
  state.careerSatisfaction = clamp(state.careerSatisfaction - 1.5, 0, 10)

  const wasMarriage = previousStatus === 'married'
  events.push(
    makeEvent('break', {
      year,
      age: state.age,
      domain: 'relationships',
      type: wasMarriage ? (kind === 'separated' ? 'separation' : 'divorce') : 'separation',
      title: wasMarriage ? (kind === 'separated' ? 'Separation' : 'Divorce') : 'Separation',
      description: `The relationship ended.${custodyNote} Housing and settlement costs reduced savings.`,
      severity: 'major',
      causes: [
        state.relationshipSatisfaction < 4 ? '- sustained low satisfaction' : '- relationship drift',
        state.sharedFinancialPressure > 5 ? '- shared financial pressure' : '',
        state.timePressure > 6 ? '- time pressure' : '',
        partner && partnerCompatibility(partner) < 0.45 ? '- compatibility tension' : '',
      ].filter(Boolean),
    }),
  )
}

/* ------------------------------- CHILDREN ------------------------------- */

const stageForAge = (age: number): ChildState['stage'] =>
  age < 2
    ? 'infancy'
    : age < 6
      ? 'early-childhood'
      : age < 13
        ? 'school-age'
        : age < 19
          ? 'adolescence'
          : age < 24
            ? 'young-adult'
            : 'independent'

const educationStageForAge = (age: number): ChildState['educationStage'] =>
  age < 5 ? 'pre' : age < 12 ? 'primary' : age < 18 ? 'secondary' : age < 23 ? 'tertiary' : 'done'

export const childrenTick = (state: LifeState, lifeSeed: number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'family')
  const { fertilityWindow, birthBasePartnered, birthBaseSingle } = FAMILY_ASSUMPTIONS

  // --- children age, transition stages, sometimes leave ---
  for (const child of state.children) {
    child.age += 1
    const previousStage = child.stage
    child.stage = stageForAge(child.age)
    child.educationStage = educationStageForAge(child.age)
    if (previousStage === 'adolescence' && child.stage === 'young-adult') {
      events.push(
        makeEvent('adult-child', {
          year,
          age: state.age,
          domain: 'family',
          type: 'child-adult',
          title: 'Child reached adulthood',
          description: `A child turned 18${child.livingWithUser ? ' and is still at home' : ''}.`,
          severity: 'minor',
          causes: ['+ child came of age'],
        }),
      )
    }
    if (child.livingWithUser && child.age >= 19 && child.age <= 24 && chance(rng, 0.35)) {
      child.livingWithUser = false
      state.householdSize = Math.max(1, state.householdSize - 1)
      events.push(
        makeEvent('leave', {
          year,
          age: state.age,
          domain: 'family',
          type: 'child-left-household',
          title: 'Child left the household',
          description: 'An adult child moved out to live independently.',
          severity: 'notable',
          causes: ['+ adult child independence'],
        }),
      )
    }
  }

  // --- arrivals ---
  if (state.childrenPreference === 'no' || state.childrenPreference === 'prefer-not') return events
  if (state.delayedChildrenUntilYear !== undefined && year < state.delayedChildrenUntilYear) return events
  const inFertilityWindow = state.age >= fertilityWindow[0] && state.age <= fertilityWindow[1]
  const partnered = PARTNERED.includes(state.relationship)
  const partner = state.partner

  const desired = state.desiredChildren
  const overDesired = desired !== undefined && state.children.length >= desired
  const suppression = overDesired ? FAMILY_ASSUMPTIONS.overDesiredSuppression : 1
  const healthFactor = 0.5 + state.healthIndex / 200

  if (inFertilityWindow) {
    const base = partnered ? birthBasePartnered : state.relationship === 'single' ? birthBaseSingle : 0.08
    const desireFactor = state.childrenPreference === 'yes' ? 1.15 : 0.5 // 'unsure'
    let partnerGate = 1
    let partnerDisagrees = false
    if (partnered && partner) {
      if (partner.childrenPreference === 'no') {
        partnerGate = 0.1
        partnerDisagrees = true
      } else if (partner.childrenPreference === 'unsure') {
        partnerGate = 0.6
      } else {
        partnerGate = 1.15
      }
    }
    const attemptBoost = state.forcedChildAttemptYears > 0 ? 3.2 : 1
    if (state.forcedChildAttemptYears > 0) state.forcedChildAttemptYears -= 1
    const birthChance = clamp(base * desireFactor * suppression * partnerGate * healthFactor * attemptBoost, 0, 0.6)
    if (chance(rng, birthChance)) {
      state.children.push(makeChild(state, lifeSeed, year, false, rng))
      state.householdSize += 1
      events.push(
        makeEvent('birth', {
          year,
          age: state.age,
          domain: 'family',
          type: 'child',
          title: 'Child joined the family',
          description: 'A child was born into the household — expenses and time demands rise.',
          severity: 'major',
          causes: [
            partnered ? '+ partnered household' : '- single household (less likely)',
            `+ age within fertility window (${state.age})`,
            partnerDisagrees ? '- partner initially preferred no (more) children' : '',
          ].filter(Boolean),
        }),
      )
    }
    return events
  }

  // Adoption as an explicit route: stated openness, childfree so far, wide window.
  if (
    state.opennessToAdoption &&
    state.children.length === 0 &&
    state.age >= 30 &&
    state.age <= 55 &&
    chance(rng, 0.022 * suppression)
  ) {
    const partnerGate = !partnered || !partner || partner.childrenPreference !== 'no'
    if (partnerGate) {
      state.children.push(makeChild(state, lifeSeed, year, true, rng))
      state.householdSize += 1
      events.push(
        makeEvent('adoption', {
          year,
          age: state.age,
          domain: 'family',
          type: 'adoption',
          title: 'Adopted a child',
          description: 'The family grew through adoption.',
          severity: 'major',
          causes: ['+ stated openness to adoption', partnered ? '+ partnered household' : ''],
        }),
      )
    }
  }

  return events
}

const makeChild = (
  state: LifeState,
  lifeSeed: number,
  year: number,
  adopted: boolean,
  rng: () => number,
): ChildState => {
  const burdenRoll = rng()
  const startAge = adopted ? uniformInt(rng, 1, 6) : 0
  return {
    id: `c-${lifeSeed.toString(36)}-${year}-${state.children.length}`,
    arrivalYear: year,
    adopted,
    age: startAge,
    stage: stageForAge(startAge),
    educationStage: educationStageForAge(startAge),
    healthBurden: burdenRoll < 0.012 ? 'significant' : burdenRoll < 0.052 ? 'mild' : 'none',
    livingWithUser: true,
  }
}

/* ------------------------- PARTNER LIFE & CAREER ------------------------ */

/** The partner ages, earns, sometimes loses work, interrupts for infants, retires. */
export const partnerTick = (
  state: LifeState,
  macro: MacroYear,
  lifeSeed: number,
  year: number,
): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const partner = state.partner
  if (!partner) return []
  const rng = rngFor(lifeSeed, year, 'relationships')

  partner.age += 1
  partner.healthIndex = clamp(
    partner.healthIndex - (partner.age > 60 ? 0.9 : 0.3) + normal(rng, 0, 0.6),
    0,
    100,
  )

  const working = partner.employment === 'employed' || partner.employment === 'self-employed'
  if (working) {
    partner.monthlyIncome *= 1 + macro.inflation * 0.9 + (partner.careerAmbition / 10) * 0.008
    // Parental/caregiving reduction while there are infants in the house.
    const infants = state.children.filter((child) => child.age < 3 && child.livingWithUser).length
    if (infants > 0 && chance(rng, 0.1)) {
      partner.monthlyIncome *= 0.9
      events.push(
        makeEvent('partner-reduce', {
          year,
          age: state.age,
          domain: 'family',
          type: 'partner-career-interruption',
          title: 'Partner reduced working hours',
          description: 'The partner stepped back at work for childcare — household income dipped.',
          severity: 'minor',
          causes: [
            '- infant/childcare demands',
            `+ country parental-leave environment ${Math.round(state.country.assumptions.socialSafetyNet * 100)}%`,
          ],
        }),
      )
    }
    if (chance(rng, 0.035 * (macro.recession ? 1.8 : 1))) {
      partner.employment = 'unemployed'
      partner.monthlyIncome = 0
      events.push(
        makeEvent('partner-jobloss', {
          year,
          age: state.age,
          domain: 'relationships',
          type: 'partner-unemployed',
          title: 'Partner lost their job',
          description: 'The partner’s employment ended — household income takes the hit.',
          severity: 'minor',
          causes: [macro.recession ? '- recession year' : '- random employment shock'],
        }),
      )
    }
  } else if (partner.employment === 'unemployed') {
    if (chance(rng, 0.55 * macro.labourFactor)) {
      partner.employment = 'employed'
      partner.monthlyIncome = median(state) * partner.incomeMultiplier * state.inflationIndex * 0.95
      events.push(
        makeEvent('partner-hired', {
          year,
          age: state.age,
          domain: 'relationships',
          type: 'partner-re-employed',
          title: 'Partner found work',
          description: 'The partner re-entered employment; household income recovers.',
          severity: 'minor',
          causes: [`+ labour factor ${macro.labourFactor.toFixed(2)}`],
        }),
      )
    }
  }

  if (partner.age >= 63 && working && chance(rng, clamp(0.12 + (partner.age - 63) * 0.06, 0, 0.5))) {
    partner.employment = 'retired'
    partner.monthlyIncome = 0
    events.push(
      makeEvent('partner-retire', {
        year,
        age: state.age,
        domain: 'relationships',
        type: 'partner-retired',
        title: 'Partner retired',
        description: 'The partner left working life; the household shifts to pension-supported finances.',
        severity: 'notable',
        causes: [`+ partner age ${partner.age}`],
      }),
    )
  }

  return events
}

/* --------------------------- EXTENDED FAMILY ---------------------------- */

/** Elder-care / family obligations: they arrive, deepen, and cost time and money. */
export const familyTick = (state: LifeState, lifeSeed: number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'family')

  if (state.careLevel === 0 && state.age >= 45 && chance(rng, 0.035)) {
    state.careLevel = 1
    events.push(
      makeEvent('care', {
        year,
        age: state.age,
        domain: 'family',
        type: 'care-increase',
        title: 'Parent care requirement increased',
        description: 'An ageing parent needs regular help — time, money and flexibility all tighten.',
        severity: 'notable',
        causes: [
          '+ ageing parents',
          state.constraints.careObligations ? '+ care obligations (stated at setup)' : '',
        ].filter(Boolean),
      }),
    )
  } else if (state.careLevel === 1 && state.age >= 55 && chance(rng, 0.05)) {
    state.careLevel = 2
    events.push(
      makeEvent('care', {
        year,
        age: state.age,
        domain: 'family',
        type: 'care-deepens',
        title: 'Care responsibilities deepened',
        description: 'Regular help became substantial care — work hours and freedom feel it.',
        severity: 'notable',
        causes: ['+ deepening care needs'],
      }),
    )
  }

  // Remittances can grow when family needs are real (and never appear from nothing).
  if (state.sendsSupport && state.careLevel > 0 && state.supportShare < 0.14 && chance(rng, 0.06)) {
    state.supportShare = clamp(state.supportShare + 0.03, 0, 0.2)
    events.push(
      makeEvent('support-up', {
        year,
        age: state.age,
        domain: 'family',
        type: 'support-increase',
        title: 'Family support increased',
        description: 'Money sent home rose with the family’s needs.',
        severity: 'minor',
        causes: ['+ family need', '+ remittance commitment'],
      }),
    )
  }

  return events
}

/* ------------------------------- FINANCE -------------------------------- */

export interface FinanceResult {
  events: SimEventDraft[]
}

export const householdExpenses = (state: LifeState, median: number): number => {
  const country = state.country
  const priceFactor = 0.4 + country.assumptions.priceLevel * 1.1
  const base = median * ECONOMIC_ASSUMPTIONS.singleAdultCostShare * priceFactor
  const householdScale = Math.pow(Math.max(1, state.householdSize), ECONOMIC_ASSUMPTIONS.householdScaleExponent)
  // Family benefits soften child costs where the safety net is strong.
  const benefitDiscount = 1 - country.assumptions.socialSafetyNet * 0.22
  const childrenCost = state.children
    .filter((child) => child.livingWithUser)
    .reduce((sum, child) => {
      const burdenFactor =
        child.healthBurden === 'significant' ? 1.8 : child.healthBurden === 'mild' ? 1.25 : 1
      return sum + median * ECONOMIC_ASSUMPTIONS.childCostShareOfMedian * childStageShare(child) * burdenFactor
    }, 0)
  const careCost = state.careLevel > 0 ? median * 0.13 * state.careLevel : 0
  const support =
    state.sendsSupport && state.monthlyIncome > 0 ? state.supportShare * state.monthlyIncome * 12 : 0
  const essential = base * householdScale * state.costMultiplier
  const discretionary = essential * (0.1 + (10 - state.behaviours.financialRestraint) * 0.02)
  // Computed in base-year prices; financeTick indexes to the current price level.
  return (essential + discretionary) * 12 + childrenCost * benefitDiscount * 12 + (careCost + support) * 12
}

const childStageShare = (child: ChildState): number => {
  const share: Record<string, number> = {
    infancy: 1.0,
    'early-childhood': 1.05,
    'school-age': 1.15,
    adolescence: 1.0,
    'young-adult': 0.6,
    independent: 0,
  }
  return share[child.stage] ?? 1
}

export const financeTick = (
  state: LifeState,
  macro: MacroYear,
  lifeSeed: number,
  year: number,
): FinanceResult => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'economy')

  // --- pension & drawdown in retirement ---
  if (state.employment === 'retired') {
    const pension =
      median(state) *
      CAREER_ASSUMPTIONS.pensionShareOfMedian *
      clamp(clamp(state.incomeMultiplier, 0.5, 2), 0.5, 2) *
      clamp(state.country.assumptions.socialSafetyNet * 1.4, 0.15, 1.3) *
      state.inflationIndex
    state.monthlyIncome = pension
  }

  const personalAnnual = state.monthlyIncome * 12
  const partnerAnnual = (state.partner?.monthlyIncome ?? 0) * 12
  const childSupportOut = state.childSupportMonthly * 12
  const sideBusinessAnnual = state.business && !state.business.fullTime ? state.business.monthlyIncome * 12 : 0
  const grossAnnual = Math.max(0, personalAnnual + partnerAnnual + sideBusinessAnnual - childSupportOut)

  // --- tuition while studying (sunk cost; dropout keeps the bill) ---
  if (state.educationPlan) {
    const tuition = median(state) * 0.2 * (1 + (EDUCATION_RANK_LOOKUP[state.educationPlan.targetLevel] ?? 5) * 0.12)
    state.savings = Math.max(0, state.savings - tuition)
  }

  // --- expenses ---
  state.annualExpenses = householdExpenses(state, median(state)) * state.inflationIndex

  // --- debt service ---
  let debtService = 0
  if (state.debt > 0) {
    const rate = ECONOMIC_ASSUMPTIONS.debtServiceRate * (state.constraints.debtObligations ? 1.15 : 1)
    debtService = Math.min(state.debt, state.debt * rate + state.debt * 0.04)
    state.debt = Math.max(0, state.debt - debtService)
  }

  const net = grossAnnual - state.annualExpenses - debtService
  if (net >= 0) {
    const investShare = clamp(
      ECONOMIC_ASSUMPTIONS.investShareBase * (0.6 + state.behaviours.financialRestraint * 0.08) + state.savingsRateDelta,
      0.05,
      0.9,
    )
    const invested = net * investShare
    state.savings += net - invested
    const returnFactor = 1 + macro.investmentReturn
    state.investments = Math.max(0, state.investments * returnFactor + invested)
  } else {
    const shortfall = -net
    const available = state.savings + state.investments
    if (available >= shortfall) {
      const fromInvestments = Math.min(state.investments, shortfall * 0.5)
      state.investments -= fromInvestments
      state.savings = Math.max(0, state.savings - (shortfall - fromInvestments))
    } else {
      state.savings = 0
      state.investments = 0
      const borrowing = shortfall - available
      state.debt += borrowing * 1.05
      if (grossAnnual > 0 && borrowing > grossAnnual * 0.5) {
        events.push(
          makeEvent('crunch', {
            year,
            age: state.age,
            domain: 'money',
            type: 'financial-emergency',
            title: 'Financial squeeze',
            description: 'Expenses exceeded income and buffers ran out — debt increased.',
            severity: 'major',
            causes: [
              state.employment === 'unemployed' ? '- income interrupted' : '- expenses above income',
              state.children.some((c) => c.livingWithUser) ? '- dependent costs' : '',
            ].filter(Boolean),
          }),
        )
      }
    }
  }

  // --- emergency shocks (independent small stuff) ---
  if (chance(rng, 0.045)) {
    const shock = state.monthlyIncome * normal(rng, 1.2, 0.4)
    state.savings = Math.max(0, state.savings - Math.max(0, shock))
    events.push(
      makeEvent('shock', {
        year,
        age: state.age,
        domain: 'money',
        type: 'unexpected-expense',
        title: 'Unexpected expense',
        description: 'An unplanned cost (repair, family need, replace something essential) hit the buffer.',
        severity: 'minor',
        causes: ['- random life-event draw', state.savings < grossAnnual * 0.2 ? '- thin savings buffer' : ''],
      }),
    )
  }

  // --- indexation ---
  state.inflationIndex *= 1 + macro.inflation
  const indexation = state.employment === 'unemployed' ? 0.4 : 0.9
  state.monthlyIncome *= 1 + macro.inflation * indexation

  return { events }
}

/* -------------------------------- HEALTH -------------------------------- */

export const healthTick = (state: LifeState, lifeSeed: number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'health')
  const H = HEALTH_ASSUMPTIONS

  const lifestyleBonus =
    (state.lifestyle.activity - 5) * 0.06 +
    (state.lifestyle.sleep - 5) * 0.05 -
    (state.lifestyle.smoking ? 0.35 : 0) -
    state.lifestyle.alcoholBand * 0.12

  const ageDrift = state.age < 40 ? H.driftUnder40 : state.age < 60 ? H.drift40to60 : H.drift60plus
  const hoursStrain = state.hoursDelta > 0 ? state.hoursDelta * 0.02 : -state.hoursDelta * -0.008
  state.healthIndex = clamp(state.healthIndex + ageDrift + lifestyleBonus - hoursStrain + normal(rng, 0, 0.8), 0, 100)

  if (chance(rng, H.mildEventBase)) {
    const cost = state.monthlyIncome * 12 * H.mildEventCostShareOfIncome * (1.3 - state.lifestyle.healthcareAccess)
    state.savings = Math.max(0, state.savings - Math.max(0, cost))
    state.temporaryLimitationYears = Math.max(state.temporaryLimitationYears, 1)
    events.push(
      makeEvent('mild', {
        year,
        age: state.age,
        domain: 'health',
        type: 'health-shock',
        title: 'Health setback (minor)',
        description: 'A temporary health issue — some cost and a rough year, then recovery.',
        severity: 'minor',
        causes: [
          `+ healthcare access ${Math.round(state.lifestyle.healthcareAccess * 100)}%`,
          state.lifestyle.smoking ? '- smoking' : '',
        ].filter(Boolean),
      }),
    )
  }

  const ageRisk = state.age > 40 ? Math.pow(H.majorEventAgeFactor, state.age - 40) : 1
  const majorChance = clamp(H.majorEventBase * ageRisk * (state.chronicCondition ? 1.5 : 1), 0, 0.3)
  if (chance(rng, majorChance)) {
    const costShare = H.majorEventCostShareOfIncome * (1.4 - state.lifestyle.healthcareAccess)
    const cost = state.monthlyIncome * 12 * clamp(costShare, 0.2, 3)
    state.savings = Math.max(0, state.savings - cost * 0.6)
    state.debt += cost * 0.4
    if (chance(rng, 0.4)) {
      state.chronicCondition = true
    }
    state.temporaryLimitationYears = Math.max(state.temporaryLimitationYears, 2)
    state.healthIndex = clamp(state.healthIndex - normal(rng, 8, 3), 0, 100)
    state.careerSatisfaction = clamp(state.careerSatisfaction - 1.5, 0, 10)
    events.push(
      makeEvent('major', {
        year,
        age: state.age,
        domain: 'health',
        type: 'major-health-event',
        title: 'Major health event',
        description: state.chronicCondition
          ? 'A serious health event struck; part of the burden becomes a lasting constraint.'
          : 'A serious health event struck — large costs and a slow recovery.',
        severity: 'major',
        causes: [
          `- age risk ×${ageRisk.toFixed(2)}`,
          `+ healthcare access ${Math.round(state.lifestyle.healthcareAccess * 100)}% (reduces cost)`,
        ],
      }),
    )
  }

  if (state.temporaryLimitationYears > 0) {
    state.temporaryLimitationYears -= 1
  }

  return events
}

/** Education: study plans (with dropout) plus workplace learning. */
export const educationTick = (state: LifeState, lifeSeed: number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'education')

  // --- study plan (intervention) ---
  const plan = state.educationPlan
  if (plan) {
    plan.remainingYears -= 1
    const dropoutChance = clamp(
      0.05 + (state.behaviours.discipline < 4 ? 0.05 : 0) + (state.healthIndex < 50 ? 0.04 : 0) + (state.timePressure > 7 ? 0.05 : 0),
      0.02,
      0.3,
    )
    if (plan.remainingYears > 0 && chance(rng, dropoutChance)) {
      state.educationPlan = null
      events.push(
        makeEvent('dropout', {
          year,
          age: state.age,
          domain: 'education',
          type: 'education-abandoned',
          title: 'Studies paused',
          description: 'The programme was abandoned partway — costs are sunk, no credential gained. Life happens; no judgement.',
          severity: 'notable',
          causes: [
            state.behaviours.discipline < 4 ? '- low discipline margin' : '',
            state.timePressure > 7 ? '- household time pressure' : '',
            state.healthIndex < 50 ? '- health strain' : '',
          ].filter(Boolean),
        }),
      )
      return events
    }
    if (plan.remainingYears <= 0) {
      const currentRank = EDUCATION_RANK_LOOKUP[state.educationLevelKey ?? 'upper-secondary'] ?? 3
      const targetRank = EDUCATION_RANK_LOOKUP[plan.targetLevel] ?? 5
      state.educationPlan = null
      state.educationLevelKey = plan.targetLevel
      if (targetRank > currentRank) {
        const boost = 1 + clamp((targetRank - currentRank) * 0.05, 0.05, 0.3)
        state.educationMultiplier = clamp(state.educationMultiplier * boost, 0.4, 3)
        state.incomeMultiplier = clamp(state.incomeMultiplier * (1 + clamp((targetRank - currentRank) * 0.045, 0.04, 0.25)), 0.15, 6)
        state.monthlyIncome = state.monthlyIncome * (1 + clamp((targetRank - currentRank) * 0.045, 0.04, 0.25))
        state.skillLevel = clamp(state.skillLevel + 10, 0, 100)
      }
      events.push(
        makeEvent('graduation2', {
          year,
          age: state.age,
          domain: 'education',
          type: 'education-completed',
          title: 'Qualification completed',
          description: `Finished the ${plan.targetLevel.replace(/-/g, ' ')}-equivalent programme — new doors open.`,
          severity: 'major',
          causes: ['+ programme completed', '+ credential + skills boost'],
        }),
      )
      return events
    }
  }

  if (state.employment === 'employed' && !state.educationPlan && chance(rng, 0.03 * (1 + state.behaviours.learningInclination * 0.15))) {
    state.skillLevel = clamp(state.skillLevel + normal(rng, 4, 1.5), 0, 100)
    events.push(
      makeEvent('training', {
        year,
        age: state.age,
        domain: 'education',
        type: 'training',
        title: 'Training or certification',
        description: 'Completed a course or credential that sharpened professional skills.',
        severity: 'minor',
        causes: [`+ learning inclination ${Math.round(state.behaviours.learningInclination)}/10`],
      }),
    )
  }
  return events
}
