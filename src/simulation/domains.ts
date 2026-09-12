import type { LifeState, SimEventDraft } from './types'
import { chance, clamp, normal, rngFor, uniform } from './rng'
import {
  CAREER_ASSUMPTIONS,
  countryMedianIncome,
  ECONOMIC_ASSUMPTIONS,
  FAMILY_ASSUMPTIONS,
  HEALTH_ASSUMPTIONS,
  RELATIONSHIP_ASSUMPTIONS,
} from './assumptions'
import { sectorExposure } from './world'
import type { MacroYear } from './world'

/**
 * Domain stage functions. Each receives the mutable working state plus the
 * year's macro context and its own deterministic RNG stream, and returns the
 * events it produced. Order of invocation is fixed by engine.ts.
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
    return { events, incomeGrowth }
  }

  // --- job loss (employed / self-employed / informal / gig) ---
  const stabilityFactor = 1.25 - clamp(state.jobStability, 0, 10) * 0.09 // stable job ⇒ ~0.35
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
  const ceilingDrag = state.seniorityIndex >= 6 ? 0.3 : 1

  const promotionChance = clamp(
    CAREER_ASSUMPTIONS.promotionBase * phaseFactor * ambitionFactor * skillFactor * labour * ceilingDrag * (macro.recession ? 0.45 : 1),
    0.001,
    0.5,
  )
  const dissatisfaction = clamp((7 - state.careerSatisfaction) / 7, 0, 1)
  const mobility = state.behaviours.geographicMobility / 10
  const jobChangeChance = clamp(
    CAREER_ASSUMPTIONS.jobChangeBase * (0.5 + dissatisfaction) * (0.6 + mobility) * labour * (macro.recession ? 0.5 : 1),
    0.001,
    0.4,
  )

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
    const change = normal(rng, (CAREER_ASSUMPTIONS.jobChangeSalaryRange[0] + CAREER_ASSUMPTIONS.jobChangeSalaryRange[1]) / 2, 0.09)
    const clamped = clamp(change, 0.9, 1.45)
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
    // Ordinary wage drift with salary compression at the top.
    const phase = state.yearsExperience < 12 ? 'early' : state.yearsExperience < 28 ? 'mid' : 'late'
    const baseRealGrowth = ECONOMIC_ASSUMPTIONS.experienceGrowth[phase]
    let realGrowth = baseRealGrowth * (0.7 + state.skillLevel / 250) * macro.wageGrowthFactor
    if (state.incomeMultiplier > 2.2) realGrowth *= 0.5 // already well above local market
    if (state.incomeMultiplier < 0.7) realGrowth *= 1.3 // room to catch up
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

  // --- skills & satisfaction drift ---
  const learningBoost = state.behaviours.learningInclination * 0.35
  state.skillLevel = clamp(state.skillLevel + (0.8 + learningBoost) * (macro.recession ? 0.5 : 1) - (state.age > 65 ? 1 : 0), 0, 100)
  state.careerSatisfaction = clamp(state.careerSatisfaction + normal(rng, 0, 0.4), 0, 10)

  return { events, incomeGrowth }
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
  const childrenCost =
    state.children.reduce((sum, child) => {
      const stage =
        child.age < 2 ? 'infancy' : child.age < 6 ? 'early' : child.age < 13 ? 'school' : child.age < 19 ? 'adolescent' : 'youngAdult'
      return sum + median * ECONOMIC_ASSUMPTIONS.childCostShareOfMedian * (FAMILY_ASSUMPTIONS.childStageShares[stage] ?? 1)
    }, 0)
  const support = state.sendsSupport ? state.supportShare * state.monthlyIncome * 12 : 0
  const essential = base * householdScale * state.costMultiplier
  const discretionary = essential * (0.1 + (10 - state.behaviours.financialRestraint) * 0.02)
  // Computed in base-year prices; financeTick indexes to the current price level.
  return (essential + discretionary) * 12 + childrenCost * 12 + support
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
  const partnerAnnual = state.partnerIncomeShare * 12
  const grossAnnual = personalAnnual + partnerAnnual

  // --- expenses (base-year costs indexed to current prices) ---
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
    const investShare = clamp(ECONOMIC_ASSUMPTIONS.investShareBase * (0.6 + state.behaviours.financialRestraint * 0.08), 0.1, 0.8)
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
      if (borrowing > grossAnnual * 0.5) {
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
              state.children.length > 0 ? '- dependent costs' : '',
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
  // Wages broadly keep up with prices; unemployment benefits lag more.
  const indexation = state.employment === 'unemployed' ? 0.4 : 0.9
  state.monthlyIncome *= 1 + macro.inflation * indexation

  return { events }
}

/* ---------------------------- RELATIONSHIPS ----------------------------- */

export const relationshipTick = (
  state: LifeState,
  lifeSeed: number,
  year: number,
): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'relationships')
  const partnered = ['dating', 'committed', 'cohabiting', 'married'].includes(state.relationship)
  state.relationshipYears += 1

  const wantsPartnership = state.desiresPartnership !== 'no'

  if (!partnered) {
    if (!wantsPartnership) return events
    const { datingBaseAtPeak, datingPeakAge, datingRange } = RELATIONSHIP_ASSUMPTIONS
    const distanceFromPeak = Math.abs(state.age - datingPeakAge)
    const ageCurve = clamp(1 - distanceFromPeak / ((datingRange[1] - datingRange[0]) / 1.6), 0.05, 1)
    const socialFactor = 0.4 + state.behaviours.sociability * 0.12
    const recoveryFactor = ['separated', 'divorced', 'widowed'].includes(state.relationship) ? 0.55 : 1
    const startChance = clamp(datingBaseAtPeak * ageCurve * socialFactor * recoveryFactor, 0, 0.5)
    if (chance(rng, startChance)) {
      state.relationship = 'dating'
      state.relationshipYears = 0
      state.relationshipSatisfaction = normal(rng, 7, 1)
      events.push(
        makeEvent('met', {
          year,
          age: state.age,
          domain: 'relationships',
          type: 'relationship-start',
          title: 'Met a partner',
          description: 'A new relationship began.',
          severity: 'notable',
          causes: [
            `+ sociability ${Math.round(state.behaviours.sociability)}/10`,
            '+ open to partnership',
          ],
        }),
      )
    }
    return events
  }

  // --- partnered: progression & breakdown ---
  state.relationshipSatisfaction = clamp(state.relationshipSatisfaction + normal(rng, (7 - state.relationshipSatisfaction) * 0.1, 0.5), 0, 10)
  const stress =
    (state.employment === 'unemployed' ? 1.5 : 0) +
    (state.debt > state.monthlyIncome * 12 ? 0.8 : 0) +
    (state.children.filter((c) => c.age < 5).length > 0 ? 0.4 : 0)

  // widowhood (rare)
  const ageFactor = Math.pow(Math.max(0, state.age - 40) / 10, 3)
  if (chance(rng, RELATIONSHIP_ASSUMPTIONS.widowhoodBase * (1 + ageFactor))) {
    state.relationship = 'widowed'
    state.partnerIncomeShare = 0
    state.relationshipYears = 0
    state.householdSize = Math.max(1, state.householdSize - 1)
    events.push(
      makeEvent('widow', {
        year,
        age: state.age,
        domain: 'relationships',
        type: 'widowhood',
        title: 'Partner passed away',
        description: 'The partnership ended through loss; the household lost a second income.',
        severity: 'major',
        causes: ['- age-related risk'],
      }),
    )
    return events
  }

  // separation / divorce
  const satisfactionFactor = clamp(1.4 - state.relationshipSatisfaction / 8, 0.2, 2.2)
  const isMarried = state.relationship === 'married'
  const breakChance = clamp(
    (isMarried ? RELATIONSHIP_ASSUMPTIONS.divorceBase : RELATIONSHIP_ASSUMPTIONS.separationBase) *
      satisfactionFactor * (1 + stress),
    0,
    0.35,
  )
  if (chance(rng, breakChance)) {
    state.relationship = isMarried ? 'divorced' : 'single'
    state.partnerIncomeShare = 0
    state.relationshipYears = 0
    state.householdSize = Math.max(1, state.householdSize - 1)
    // Splitting a household is expensive.
    const settlementCost = state.monthlyIncome * normal(rng, 3, 1)
    state.savings = Math.max(0, state.savings - Math.max(0, settlementCost))
    state.careerSatisfaction = clamp(state.careerSatisfaction - 1.5, 0, 10)
    events.push(
      makeEvent('break', {
        year,
        age: state.age,
        domain: 'relationships',
        type: isMarried ? 'divorce' : 'separation',
        title: isMarried ? 'Divorce' : 'Separation',
        description: 'The relationship ended. Housing and settlement costs reduced savings.',
        severity: 'major',
        causes: [
          state.relationshipSatisfaction < 4 ? '- sustained low satisfaction' : '- relationship drift',
          stress > 0.5 ? '- financial/time stress on the household' : '',
        ].filter(Boolean),
      }),
    )
    return events
  }

  // progression
  const progression: Record<string, { next: string; chance: number; requires?: string[] }> = {
    dating: { next: 'committed', chance: RELATIONSHIP_ASSUMPTIONS.datingToCommitted, requires: ['1y'] },
    committed: { next: 'cohabiting', chance: RELATIONSHIP_ASSUMPTIONS.committedToCohabiting },
    cohabiting: { next: 'married', chance: RELATIONSHIP_ASSUMPTIONS.cohabitingToMarried },
  }
  const step = progression[state.relationship]
  if (step) {
    const preferenceGate =
      step.next === 'married'
        ? state.marriagePreference === 'not-for-me'
          ? 0
          : state.marriagePreference === 'important'
            ? 1.6
            : 1
        : 1
    const timeGate = state.relationshipYears >= 1 ? 1 : 0
    if (preferenceGate > 0 && timeGate > 0 && chance(rng, step.chance * preferenceGate)) {
      state.relationship = step.next as typeof state.relationship
      state.householdSize = Math.max(state.householdSize, 2)
      if (step.next !== 'dating') {
        state.partnerIncomeShare = chance(rng, RELATIONSHIP_ASSUMPTIONS.partnerEmploymentRate)
          ? clamp(normal(rng, RELATIONSHIP_ASSUMPTIONS.partnerIncomeShareOfMedian, 0.35), 0.1, 2.2) * median(state)
          : 0
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
          description: 'The partnership moved to its next stage.',
          severity: 'notable',
          causes: [
            `+ relationship duration ${state.relationshipYears}y`,
            step.next === 'married' ? `+ attitude to marriage: ${state.marriagePreference ?? 'open'}` : '',
          ].filter(Boolean),
        }),
      )
    }
  }

  return events
}

/* ------------------------------- CHILDREN ------------------------------- */

export const childrenTick = (state: LifeState, lifeSeed: number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'family')
  const { fertilityWindow, birthBasePartnered, birthBaseSingle } = FAMILY_ASSUMPTIONS

  // Children age; independent-adult children may leave the household count.
  for (const child of state.children) child.age += 1

  if (state.childrenPreference === 'no' || state.childrenPreference === 'prefer-not') return events
  if (state.age < fertilityWindow[0] || state.age > fertilityWindow[1]) return events

  const partnered = ['committed', 'cohabiting', 'married'].includes(state.relationship)
  const base = partnered ? birthBasePartnered : state.relationship === 'single' ? birthBaseSingle : 0.1
  const desireFactor = state.childrenPreference === 'yes' ? 1.15 : 0.5 // 'unsure'
  const desired = state.desiredChildren
  const overDesired = desired !== undefined && state.children.length >= desired
  const suppress = overDesired ? FAMILY_ASSUMPTIONS.overDesiredSuppression : 1
  const healthFactor = 0.5 + state.healthIndex / 200

  const birthChance = clamp(base * desireFactor * suppress * healthFactor, 0, 0.5)
  if (chance(rng, birthChance)) {
    state.children.push({ age: 0 })
    state.householdSize += 1
    events.push(
      makeEvent('birth', {
        year,
        age: state.age,
        domain: 'family',
        type: 'child',
        title: 'Child joined the family',
        description: 'A child was born (or adopted) into the household — expenses and time demands rise.',
        severity: 'major',
        causes: [
          partnered ? '+ partnered household' : '- single household (less likely)',
          `+ age within fertility window (${state.age})`,
          state.childrenPreference === 'yes' ? '+ stated desire for children' : '+ uncertain preference',
        ],
      }),
    )
  }

  return events
}

/* -------------------------------- HEALTH -------------------------------- */

export const healthTick = (state: LifeState, lifeSeed: number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'health')
  const H = HEALTH_ASSUMPTIONS

  // Lifestyle modifiers
  const lifestyleBonus =
    (state.lifestyle.activity - 5) * 0.06 +
    (state.lifestyle.sleep - 5) * 0.05 -
    (state.lifestyle.smoking ? 0.35 : 0) -
    state.lifestyle.alcoholBand * 0.12

  const ageDrift =
    state.age < 40 ? H.driftUnder40 : state.age < 60 ? H.drift40to60 : H.drift60plus
  state.healthIndex = clamp(state.healthIndex + ageDrift + lifestyleBonus + normal(rng, 0, 0.8), 0, 100)

  // Mild events
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

  // Major events
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

  // Recovery from temporary limitations
  if (state.temporaryLimitationYears > 0) {
    state.temporaryLimitationYears -= 1
  }

  return events
}

/** Education: skill/learning events for working adults (study programmes come later). */
export const educationTick = (state: LifeState, lifeSeed: number, year: number): SimEventDraft[] => {
  const events: SimEventDraft[] = []
  const rng = rngFor(lifeSeed, year, 'education')
  if (state.employment === 'employed' && chance(rng, 0.03 * (1 + state.behaviours.learningInclination * 0.15))) {
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
