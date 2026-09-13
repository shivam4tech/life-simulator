import type { CountryProfile, PersonProfile } from '@/domain'
import { getCountryProfile, listCountryProfiles } from '@/data/countries'
import { OCCUPATION_MODELS } from './careers'
import { countryMedianIncome } from './assumptions'
import { clamp } from './rng'
import { hashString } from './rng'

/**
 * Destination explorer — goal-dependent country recommendations.
 *
 * Never GDP-ranked, never one "best country": the ranking responds to the
 * user's priorities (career, savings, family, stability, adventure) and to
 * their actual position (occupation transferability, credentials, family
 * needs). All bands are model outputs with placeholder confidence.
 */

export interface DestinationPriorities {
  career: number // 0–10
  savings: number
  family: number
  stability: number
  adventure: number
}

export const DEFAULT_PRIORITIES: DestinationPriorities = {
  career: 6,
  savings: 6,
  family: 5,
  stability: 5,
  adventure: 4,
}

export type Band3 = 'low' | 'moderate' | 'high'
export type FamilyBand = 'supportive' | 'mixed' | 'hard'

export interface DestinationCard {
  code: string
  name: string
  currency: string
  archetype: string
  score: number
  careerFit: Band3
  migrationFriction: Band3
  languageGap: Band3
  financialUpside: Band3
  familyImpact: FamilyBand
  stabilityBand: Band3
  /** Median-income ratio vs the user's current country (purchasing-power-ish). */
  wageRatio: number
  why: string[]
  frictions: string[]
  confidence: 'placeholder'
}

const band3 = (value: number, invert = false): Band3 => {
  const v = invert ? 1 - value : value
  return v >= 0.6 ? 'high' : v >= 0.35 ? 'moderate' : 'low'
}

const languageGapFor = (target: CountryProfile): Band3 => {
  // Placeholder: uses integration support + migration accessibility as a proxy
  // for how navigable the destination is for newcomers without the language.
  const navigability = (target.assumptions.integrationSupport * 0.6 + target.assumptions.immigrationAccessibility * 0.4)
  return band3(navigability, true)
}

/** Language fit placeholder: unknown inputs model as a mid-low draw (deterministic per profile). */
export const profileLanguageFit = (profile: PersonProfile): number => {
  const seedTag = profile.id ?? 'profile'
  const h = hashString(seedTag)
  return clamp(0.3 + ((h >>> 8) % 100) / 250, 0.2, 0.7)
}

/** Lightweight feasibility preview for destination cards (profile-level). */
export const migrationPreview = (profile: PersonProfile, targetCode: string): FeasibilityPreview => {
  const target = getCountryProfile(targetCode)
  if (!target) {
    return { band: 'difficult', score: 0.2, reasons: [], frictions: ['unsupported destination'] }
  }
  const occupation = OCCUPATION_MODELS[profile.employment?.occupationFamily ?? 'other']
  const transferability = occupation?.internationalTransferability ?? 0.5
  const credentialFactor = clamp(0.5 + target.assumptions.credentialRecognition * 0.5 * (0.5 + transferability * 0.5), 0.15, 1)
  const age = profile.demographics.age?.kind === 'known' ? profile.demographics.age.value : 35
  const ageFactor = age <= 30 ? 1 : age <= 40 ? 0.92 : age <= 50 ? 0.78 : 0.6
  const savings = profile.finances?.savings?.kind === 'known'
    ? profile.finances.savings.value.value / (profile.finances.savings.value.period === 'month' ? 1 : 12)
    : undefined
  const targetMedian = countryMedianIncome(target)
  const movingCost = targetMedian * clamp(4 + (profile.dependents?.count?.kind === 'known' ? profile.dependents.count.value : 0) * 1.2, 3, 10)
  const savingsRatio = savings !== undefined ? clamp(savings / Math.max(movingCost, 1), 0, 2) : 0.5

  const score = clamp(
    credentialFactor * 0.24 +
      clamp(savingsRatio, 0, 1) * 0.2 +
      clamp((profile.education?.level ? 1 : 0.6), 0, 1.3) * 0.14 +
      (target.assumptions.immigrationAccessibility * 0.6 + target.assumptions.migrationAttractiveness * 0.4) * 0.18 +
      profileLanguageFit(profile) * 0.14 +
      ageFactor * 0.1,
    0.05,
    0.98,
  )

  const reasons: string[] = []
  const frictions: string[] = []
  reasons.push(`occupation transferability ${Math.round(transferability * 100)}%`)
  reasons.push(`credential recognition ${Math.round(target.assumptions.credentialRecognition * 100)}%`)
  reasons.push(`language fit ${Math.round(profileLanguageFit(profile) * 100)}% (modelled)`)
  if (savings === undefined) frictions.push('savings unknown — assumed mid-range')
  else if (savingsRatio < 1) frictions.push(`savings cover ~${Math.round(savingsRatio * 100)}% of move costs`)
  if (age > 45) frictions.push('age slows settlement in the model')

  return {
    band: score >= 0.66 ? 'smooth' : score >= 0.44 ? 'moderate' : 'difficult',
    score,
    reasons,
    frictions,
  }
}

export interface FeasibilityPreview {
  band: 'difficult' | 'moderate' | 'smooth'
  score: number
  reasons: string[]
  frictions: string[]
}

export const recommendDestinations = (
  profile: PersonProfile,
  priorities: DestinationPriorities,
  limit = 6,
): DestinationCard[] => {
  const origin = getCountryProfile(profile.demographics.countryOfResidence)
  if (!origin) return []
  const originMedian = countryMedianIncome(origin)
  const occupation = OCCUPATION_MODELS[profile.employment?.occupationFamily ?? 'other']
  const transferability = occupation?.internationalTransferability ?? 0.5
  const hasCareObligations = profile.constraints?.familyCareObligations || profile.household?.hasCareObligations

  const prioritySum = Math.max(1, priorities.career + priorities.savings + priorities.family + priorities.stability + priorities.adventure)

  const cards: DestinationCard[] = []
  for (const target of listCountryProfiles()) {
    if (target.identity.code === origin.identity.code) continue

    const targetMedian = countryMedianIncome(target)
    const wageRatio = clamp(targetMedian / Math.max(originMedian, 1), 0.1, 15)
    // Career opportunity rewards dynamic markets (entrepreneurship, job mobility),
    // not just wealth — so career-first and family-first rankings genuinely differ.
    const careerFitRaw = clamp(
      transferability * 0.3 +
        target.assumptions.labourMarketStrength * 0.25 +
        target.assumptions.entrepreneurshipEnvironment * 0.2 +
        (1 - target.assumptions.employmentProtection) * 0.1 +
        clamp(Math.log(wageRatio) / Math.log(6), -1, 1) * 0.15,
      0,
      1,
    )
    // Savings potential: income upside minus cost drag.
    const netUpside = clamp(target.assumptions.incomeLevel - target.assumptions.priceLevel * 0.85, -1, 1)
    const savingsRaw = clamp(0.5 + netUpside * 0.9, 0, 1)
    const familyRaw = clamp(
      target.assumptions.socialSafetyNet * 0.4 + target.assumptions.healthcareAccess * 0.3 + target.assumptions.educationAccess * 0.3,
      0,
      1,
    )
    const stabilityRaw = clamp(target.assumptions.institutionalStability - target.assumptions.economicVolatility * 0.5, 0, 1)
    const adventureRaw = clamp(
      target.assumptions.migrationAttractiveness * 0.5 + (target.archetype === origin.archetype ? 0.2 : 0.55),
      0,
      1,
    )

    const frictionPenalty = 1 - (1 - target.assumptions.immigrationAccessibility) * 0.35
    const credentialPenalty = 1 - (1 - target.assumptions.credentialRecognition) * 0.2 * (1 - transferability)

    // Deterministic tiebreakers so similar archetypes still spread out.
    const tiebreaker =
      (target.assumptions.credentialRecognition * 0.03 + target.assumptions.migrationAttractiveness * 0.03) *
      ((hashString(target.identity.code) % 100) / 100)

    const score =
      ((careerFitRaw * priorities.career +
        savingsRaw * priorities.savings +
        familyRaw * priorities.family +
        stabilityRaw * priorities.stability +
        adventureRaw * priorities.adventure) /
        prioritySum +
        tiebreaker * 0.06) *
      frictionPenalty *
      clamp(credentialPenalty, 0.4, 1)

    const why: string[] = []
    if (wageRatio > 1.8) why.push(`modelled median income ~${wageRatio.toFixed(1)}× your origin country`)
    else if (wageRatio > 1.3) why.push('meaningful wage upside in the model')
    if (careerFitRaw > 0.62 && transferability > 0.7) why.push('your field transfers well here')
    if (target.assumptions.socialSafetyNet > 0.7) why.push('strong safety net supports families')
    if (target.assumptions.institutionalStability > 0.85) why.push('high institutional stability')
    if (target.assumptions.immigrationAccessibility > 0.5) why.push('relatively open immigration model')
    if (why.length === 0) why.push('balanced profile across your priorities')

    const frictions: string[] = []
    if (target.assumptions.credentialRecognition < 0.4) frictions.push('credential recognition is slow in the model')
    if (languageGapFor(target) === 'high') frictions.push('language barrier is significant (modelled)')
    if (target.assumptions.priceLevel > origin.assumptions.priceLevel * 1.5) frictions.push('cost of living jumps sharply')
    if (hasCareObligations && target.identity.region !== origin.identity.region) frictions.push('moving far complicates family care duties')
    if (target.assumptions.immigrationAccessibility < 0.3) frictions.push('restrictive immigration model')

    cards.push({
      code: target.identity.code,
      name: target.identity.name,
      currency: target.identity.currency,
      archetype: target.archetype,
      score,
      careerFit: band3(careerFitRaw),
      migrationFriction: band3(target.assumptions.immigrationAccessibility, true),
      languageGap: languageGapFor(target),
      financialUpside: band3(savingsRaw),
      familyImpact: familyRaw >= 0.62 ? 'supportive' : familyRaw >= 0.38 ? 'mixed' : 'hard',
      stabilityBand: band3(stabilityRaw),
      wageRatio,
      why,
      frictions,
      confidence: 'placeholder',
    })
  }

  return cards.sort((a, b) => b.score - a.score).slice(0, limit)
}
