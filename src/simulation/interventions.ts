import type { EducationLevel, OccupationFamily, SettlementType } from '@/domain'

/**
 * Scenario interventions — the typed command model behind the Decision Lab.
 *
 * Interventions are applied to the initial LifeState of a scenario branch
 * (the fork is "now" — arbitrary-year rewind forks arrive in Sprint 8).
 * Not every intervention has UI yet; the model is built to be extended.
 */

export type Intervention =
  | { type: 'change-career'; target: OccupationFamily; retrainingYears: number }
  | { type: 'start-education'; level: EducationLevel; years: number; mode: 'full-time' | 'part-time' }
  | { type: 'start-business'; industry: OccupationFamily; startingCapitalShare: number; fullTime: boolean }
  | { type: 'change-job'; targetSalaryIncrease: number; searchIntensity: number }
  | { type: 'change-savings-rate'; delta: number }
  | { type: 'change-working-hours'; deltaHours: number }
  | { type: 'relocate'; settlement: SettlementType }
  | { type: 'have-child' }
  | { type: 'delay-children'; years: number }
  | { type: 'migrate'; targetCountry: string; settlement?: SettlementType }
  | { type: 'lifestyle-change'; activityDelta: number; sleepDelta: number }
  | { type: 'prioritize-relationship' }
  | { type: 'separate' }
  | { type: 'learn-skill' }
  | { type: 'buy-home' }

export interface InterventionSummary {
  title: string
  detail: string
}

export const describeIntervention = (intervention: Intervention): InterventionSummary => {
  switch (intervention.type) {
    case 'change-career':
      return {
        title: `Switch to ${intervention.target.replace(/-/g, ' ')}`,
        detail:
          intervention.retrainingYears > 0
            ? `with ~${intervention.retrainingYears}y retraining`
            : 'direct move, no formal retraining',
      }
    case 'start-education':
      return {
        title: `Study for a ${intervention.level.replace(/-/g, ' ')}-equivalent`,
        detail: `${intervention.years}y ${intervention.mode}`,
      }
    case 'start-business':
      return {
        title: `Start a ${intervention.industry.replace(/-/g, ' ')} business`,
        detail: `${intervention.fullTime ? 'full-time' : 'side business'}, capital ≈ ${Math.round(intervention.startingCapitalShare * 100)}% of savings`,
      }
    case 'change-job':
      return {
        title: 'Look for a better-paying job',
        detail: `target +${Math.round(intervention.targetSalaryIncrease * 100)}%, search intensity ${Math.round(intervention.searchIntensity)}/10`,
      }
    case 'change-savings-rate':
      return {
        title: `${intervention.delta >= 0 ? 'Save more' : 'Save less'}`,
        detail: `${intervention.delta >= 0 ? '+' : ''}${Math.round(intervention.delta * 100)}% of income redirected`,
      }
    case 'change-working-hours':
      return {
        title: intervention.deltaHours > 0 ? 'Work more' : 'Work less',
        detail: `${intervention.deltaHours > 0 ? '+' : ''}${intervention.deltaHours} h/week`,
      }
    case 'relocate':
      return {
        title: `Relocate domestically`,
        detail: `move to a ${intervention.settlement.replace(/-/g, ' ')}`,
      }
    case 'have-child':
      return { title: 'Try for a child now', detail: 'actively attempt parenthood' }
    case 'delay-children':
      return { title: 'Delay children', detail: `wait ~${intervention.years}y before trying` }
    case 'migrate': {
      const target = intervention.targetCountry.toUpperCase()
      return {
        title: `Migrate to ${target}`,
        detail: intervention.settlement ? `settling in a ${intervention.settlement.replace(/-/g, ' ')}` : 'international move',
      }
    }
    case 'lifestyle-change':
      return {
        title: 'Change daily habits',
        detail: `activity ${intervention.activityDelta >= 0 ? '+' : ''}${intervention.activityDelta}, sleep ${intervention.sleepDelta >= 0 ? '+' : ''}${intervention.sleepDelta}`,
      }
    case 'prioritize-relationship':
      return { title: 'Prioritize the relationship', detail: 'more time and attention at home' }
    case 'separate':
      return { title: 'Separate', detail: 'end the partnership now' }
    case 'learn-skill':
      return { title: 'Learn a new skill', detail: 'focused self-directed learning' }
    case 'buy-home':
      return { title: 'Buy a home', detail: 'attempt purchase when affordable' }
  }
}

export const DEFAULT_BRANCH_NAME = (interventions: Intervention[]): string => {
  if (interventions.length === 0) return 'Baseline'
  const first = describeIntervention(interventions[0]!)
  if (interventions.length === 1) return first.title
  return `${first.title} +${interventions.length - 1} more`
}
