import type { EducationLevel, OccupationFamily, SettlementType } from '@/domain'
import { SETTLEMENT_ECONOMICS } from '@/domain/country'
import { assessSwitch, OCCUPATION_MODELS, switchIncomeEffect } from './careers'
import { applyMigration } from './migrations'
import { assessHomePurchase } from './economy'
import { separateNow, applyLifestyleChange, applyPrioritizeRelationship, applyLearnSkill } from './lifestyle-interventions'
import { clamp } from './rng'
import type { EducationPlan, LifeState } from './types'
import type { Intervention } from './interventions'

/**
 * Apply scenario interventions to a freshly-initialised LifeState.
 * The fork is "now" (simulation start); mid-life rewind forks arrive in
 * Sprint 8 and will reuse this module on restored snapshots.
 *
 * Design rules:
 *  - career capital (network, management, skills) largely SURVIVES switches —
 *    path dependence is the point;
 *  - salary resets are temporary scars, not erasures;
 *  - every intervention is honest about its costs (training income dips,
 *    tuition, moving costs, business capital at risk).
 */

export const applyInterventions = (state: LifeState, interventions: Intervention[]): LifeState => {
  for (const intervention of interventions) {
    applyOne(state, intervention)
  }
  return state
}

const applyOne = (state: LifeState, intervention: Intervention): void => {
  switch (intervention.type) {
    case 'change-career':
      applyCareerChange(state, intervention.target, intervention.retrainingYears)
      break
    case 'start-education':
      applyEducation(state, intervention.level, intervention.years, intervention.mode)
      break
    case 'start-business':
      applyBusiness(state, intervention.industry, intervention.startingCapitalShare, intervention.fullTime)
      break
    case 'change-job':
      state.jobHuntBoostYears = 3
      state.jobHuntTargetIncrease = clamp(intervention.targetSalaryIncrease, 0.02, 0.5)
      break
    case 'change-savings-rate':
      state.savingsRateDelta = clamp(intervention.delta, -0.2, 0.35)
      break
    case 'change-working-hours': {
      const delta = clamp(intervention.deltaHours, -20, 20)
      state.hoursDelta = delta
      state.monthlyIncome *= 1 + (delta / 40) * 0.55
      break
    }
    case 'relocate':
      applyRelocation(state, intervention.settlement)
      break
    case 'migrate':
      applyMigration(state, intervention.targetCountry, intervention.settlement)
      break
    case 'lifestyle-change':
      applyLifestyleChange(state, intervention.activityDelta, intervention.sleepDelta)
      break
    case 'prioritize-relationship':
      applyPrioritizeRelationship(state)
      break
    case 'separate':
      separateNow(state)
      break
    case 'learn-skill':
      applyLearnSkill(state)
      break
    case 'have-child':
      state.forcedChildAttemptYears = 4
      break
    case 'delay-children':
      state.delayedChildrenUntilYear = state.calendarYear + clamp(intervention.years, 1, 15)
      break
    case 'buy-home':
      applyHomePurchase(state)
      break
  }
}

const applyCareerChange = (
  state: LifeState,
  target: OccupationFamily,
  retrainingYears: number,
): void => {
  const from = state.occupationFamily
  if (from === target) return
  const assessment = assessSwitch(from, target, state.educationLevelKey as EducationLevel | undefined)
  const effect = switchIncomeEffect(from, target)

  state.occupationFamily = target
  // Experience transfers partially: a step down in seniority for far jumps.
  state.seniorityIndex =
    assessment.distance >= 0.5 ? Math.max(0, state.seniorityIndex - 1) : state.seniorityIndex
  // Salary resets, but the personal anchor keeps most of the story.
  state.incomeMultiplier = clamp(state.incomeMultiplier * effect.ratio * 0.92, 0.15, 6)
  state.monthlyIncome = Math.max(state.monthlyIncome * effect.ratio * 0.92, 0)
  // Skills transfer with overlap; network dilutes but survives.
  state.skillLevel = clamp(state.skillLevel * (0.5 + assessment.skillOverlap * 0.45), 0, 100)
  state.network = clamp(state.network * 0.65, 0, 100)
  state.yearsInJob = 0
  state.jobStability = clamp(state.jobStability - 1, 0, 10)
  state.retrainingYearsLeft = retrainingYears
  if (retrainingYears > 0) {
    state.monthlyIncome *= 0.7
  }
}

const applyEducation = (
  state: LifeState,
  level: EducationLevel,
  years: number,
  mode: 'full-time' | 'part-time',
): void => {
  const plan: EducationPlan = {
    targetLevel: level,
    remainingYears: years,
    totalYears: years,
    mode,
  }
  state.educationPlan = plan
  if (mode === 'full-time' && state.employment === 'employed') {
    state.monthlyIncome *= 0.35 // studying instead of working most hours
  } else if (mode === 'part-time') {
    state.monthlyIncome *= 0.92
  }
}

const applyBusiness = (
  state: LifeState,
  industry: OccupationFamily,
  startingCapitalShare: number,
  fullTime: boolean,
): void => {
  const capital = Math.max(0, state.savings * clamp(startingCapitalShare, 0.05, 0.9))
  state.savings -= capital
  const applicability = OCCUPATION_MODELS[industry]?.entrepreneurialApplicability ?? 0.5
  state.business = {
    industry,
    phase: 'early',
    monthlyIncome: fullTime ? state.monthlyIncome * 0.3 * (0.7 + applicability * 0.6) : state.monthlyIncome * 0.12,
    yearsRunning: 0,
    capitalInvested: capital,
    fullTime,
  }
  if (fullTime) {
    state.employment = 'self-employed'
    state.monthlyIncome = state.business.monthlyIncome
  }
}

/** Buy a home if the household can actually afford it (ratio-based, Sprint 9). */
const applyHomePurchase = (state: LifeState): void => {
  const assessment = assessHomePurchase(state)
  if (!assessment.affordable) return // cannot afford: nothing happens
  state.savings = Math.max(0, state.savings - assessment.downPayment)
  state.debt += assessment.mortgage
  state.assets += assessment.price
}

const applyRelocation = (state: LifeState, settlement: SettlementType): void => {
  if (state.settlement === settlement) return
  const oldEconomics = SETTLEMENT_ECONOMICS[state.settlement]
  const newEconomics = SETTLEMENT_ECONOMICS[settlement]
  const wageRatio = newEconomics.wageFactor / oldEconomics.wageFactor
  const costRatio = newEconomics.costFactor / oldEconomics.costFactor
  state.settlement = settlement
  state.monthlyIncome *= wageRatio
  state.incomeMultiplier *= wageRatio
  state.costMultiplier *= costRatio
  // Moving costs a couple of months of income.
  state.savings = Math.max(0, state.savings - state.monthlyIncome * 2)
}
