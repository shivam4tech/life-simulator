import type { PersonProfile, EducationLevel, OccupationFamily } from '@/domain'
import { assessSwitch, switchIncomeEffect, OCCUPATION_MODELS, type SwitchAssessment } from './careers'
import { OCCUPATION_FAMILIES } from '@/domain/taxonomies'
import { clamp } from './rng'

/**
 * Career recommendation engine — rule-based, explainable, no LLMs.
 *
 * Ranks occupation families by how reachable and how promising they are from
 * the user's current state. Never salary-only: distance, growth outlook,
 * stability, remote and migration potential all weigh in, and every entry
 * carries its reasons.
 */

export type RecommendationTier = 'strong' | 'longer-term' | 'stretch'

export interface CareerRecommendation {
  target: OccupationFamily
  tier: RecommendationTier
  assessment: SwitchAssessment
  /** Expected long-run income multiplier vs staying (model estimate). */
  incomeRatio: number
  incomeNote: string
  score: number
  reasons: string[]
}

export interface RecommendationInput {
  profile: Pick<PersonProfile, 'education' | 'employment' | 'demographics' | 'behaviours'>
}

export const recommendCareers = (input: RecommendationInput): CareerRecommendation[] => {
  const current = input.profile.employment?.occupationFamily ?? 'other'
  const education = input.profile.education?.level as EducationLevel | undefined
  const mobility = input.profile.behaviours?.geographicMobility ?? 5
  const riskTolerance = input.profile.behaviours?.riskTolerance ?? 5
  const remoteInterest = input.profile.employment?.remoteCompatible ?? false

  const recommendations: CareerRecommendation[] = []
  for (const family of OCCUPATION_FAMILIES) {
    if (family.id === current) continue
    const target = family.id as OccupationFamily
    const assessment = assessSwitch(current, target, education)
    const effect = switchIncomeEffect(current, target)
    const model = OCCUPATION_MODELS[target]

    const baseIncomeRatio =
      ((OCCUPATION_MODELS[target]?.incomeCeiling ?? 2) / (OCCUPATION_MODELS[current]?.incomeCeiling ?? 2))
    const growthBonus = clamp(model.growthOutlook, -1, 1) * 0.35
    const remoteBonus = remoteInterest && model.remoteCompatibility > 0.7 ? 0.12 : 0
    const mobilityBonus = mobility >= 7 && model.internationalTransferability > 0.8 ? 0.1 : 0
    const riskPenalty = riskTolerance <= 3 && model.stability < 0.45 ? 0.12 : 0

    const score = clamp(
      baseIncomeRatio * 0.4 + growthBonus + remoteBonus + mobilityBonus - assessment.distance * 0.9 - riskPenalty,
      -1,
      2,
    )

    const reasons: string[] = [...assessment.reasons]
    reasons.unshift(`reachability: ${assessment.difficulty.replace(/-/g, ' ')} (~${assessment.trainingYears}y training)`)
    reasons.push(effect.note)
    if (model.growthOutlook > 0.25) reasons.push('+ positive modelled sector outlook')
    if (model.stability > 0.75) reasons.push('+ very stable employment base')
    if (model.remoteCompatibility > 0.85) reasons.push('+ strong remote potential')
    if (model.internationalTransferability > 0.85 && mobility >= 6) {
      reasons.push('+ transfers well abroad if you ever move')
    }
    if (model.automationExposure > 0.7) reasons.push('- high automation exposure in the model')

    let tier: RecommendationTier
    if (assessment.distance <= 0.4 && score > 0.45) tier = 'strong'
    else if (assessment.distance <= 0.75 && score > 0.25) tier = 'longer-term'
    else tier = 'stretch'

    recommendations.push({
      target,
      tier,
      assessment,
      incomeRatio: effect.ratio,
      incomeNote: effect.note,
      score,
      reasons,
    })
  }

  return recommendations.sort((a, b) => b.score - a.score)
}
