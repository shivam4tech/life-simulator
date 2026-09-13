import type { LifeState } from './types'
import { clamp, rngFor } from './rng'

/**
 * Lifestyle & relationship interventions (Sprint 8 palette).
 * Effects are model-honest: concrete, small, and consistent with the way the
 * engine already treats these variables — no miracle transformations.
 */

export const applyLifestyleChange = (state: LifeState, activityDelta: number, sleepDelta: number): void => {
  state.lifestyle.activity = clamp(state.lifestyle.activity + activityDelta, 0, 10)
  state.lifestyle.sleep = clamp(state.lifestyle.sleep + sleepDelta, 0, 10)
}

/** "Prioritize the relationship" = time and attention: pressure down, stability up. */
export const applyPrioritizeRelationship = (state: LifeState): void => {
  if (!state.partner) return
  state.timePressure = clamp(state.timePressure - 2.5, 0, 10)
  state.relationshipStability = clamp(state.relationshipStability + 1.5, 0, 10)
  state.relationshipSatisfaction = clamp(state.relationshipSatisfaction + 1, 0, 10)
  state.hoursDelta = clamp(state.hoursDelta - 4, -20, 20)
  state.monthlyIncome *= 0.97
}

/** Immediate separation at the fork (deterministic settlement). */
export const separateNow = (state: LifeState): void => {
  const partner = state.partner
  if (!partner) return
  const rng = rngFor(0, state.calendarYear, 'relationships')
  const wasMarried = state.relationship === 'married'
  state.relationship = wasMarried ? 'divorced' : 'single'
  state.partner = null
  state.relationshipYears = 0
  state.relationshipSatisfaction = clamp(state.relationshipSatisfaction - 2, 0, 10)

  const settlementCost = state.monthlyIncome * normalDraw(rng, 3, 1)
  state.savings = Math.max(0, state.savings - Math.max(0, settlementCost))

  const minorChildren = state.children.filter((child) => child.age < 18 && child.livingWithUser)
  if (minorChildren.length > 0 && !coinFlip(rng, 0.7)) {
    for (const child of minorChildren) {
      child.livingWithUser = false
      if (state.householdSize >= 2) state.householdSize -= 1
    }
    state.childSupportMonthly = state.monthlyIncome * 0.15 * minorChildren.length
  }
  if (partner && state.householdSize >= 2) state.householdSize -= 1
  state.careerSatisfaction = clamp(state.careerSatisfaction - 1.5, 0, 10)
}

const normalDraw = (rng: () => number, mean: number, stdDev: number): number => {
  const u1 = Math.max(rng(), 1e-12)
  const u2 = rng()
  return mean + stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

const coinFlip = (rng: () => number, p: number): boolean => rng() < p

/** One focused self-directed skill push. */
export const applyLearnSkill = (state: LifeState): void => {
  state.skillLevel = clamp(state.skillLevel + 8, 0, 100)
  state.learningBoostYears = 3
}
