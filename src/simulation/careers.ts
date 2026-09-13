import type { EducationLevel, OccupationFamily } from '@/domain'
import { clamp } from './rng'

/**
 * Occupation model — 20 broad families, each with modelling attributes.
 * ⚠️ All values are PLACEHOLDER modelling coefficients for relative behaviour,
 * not observed labour statistics. Real datasets can replace them per-value.
 */

export interface OccupationModel {
  family: OccupationFamily
  /** Minimum education that keeps the path realistically open (modelling gate). */
  educationRequirement: EducationLevel
  /** 0–1: how much formal credentials gate entry (medicine/law high). */
  credentialBarrier: number
  /** 0–1: how strongly skill level drives progression and pay. */
  skillDemand: number
  /** 0–1: physical intensity (limits late-career staying power). */
  physicalIntensity: number
  /** 0–1: how well the work can be done remotely. */
  remoteCompatibility: number
  /** Gross income ceiling as a multiple of the local median. */
  incomeCeiling: number
  /** 0–1: baseline job stability. */
  stability: number
  /** 0–1: exposure to automation/disruption. */
  automationExposure: number
  /** 0–1: how fast one can climb (promotion density). */
  careerMobility: number
  /** 0–1: how well the field supports starting a business. */
  entrepreneurialApplicability: number
  /** 0–1: how transferable across borders (feeds Sprint 7). */
  internationalTransferability: number
  /** −1..+1: placeholder sector demand trend across a simulation horizon. */
  growthOutlook: number
}

export const OCCUPATION_MODELS: Record<OccupationFamily, OccupationModel> = {
  administration: { family: 'administration', educationRequirement: 'upper-secondary', credentialBarrier: 0.2, skillDemand: 0.45, physicalIntensity: 0.25, remoteCompatibility: 0.7, incomeCeiling: 2.2, stability: 0.65, automationExposure: 0.75, careerMobility: 0.6, entrepreneurialApplicability: 0.35, internationalTransferability: 0.7, growthOutlook: -0.2 },
  agriculture: { family: 'agriculture', educationRequirement: 'primary', credentialBarrier: 0.05, skillDemand: 0.4, physicalIntensity: 0.85, remoteCompatibility: 0.05, incomeCeiling: 1.6, stability: 0.45, automationExposure: 0.5, careerMobility: 0.3, entrepreneurialApplicability: 0.75, internationalTransferability: 0.4, growthOutlook: -0.1 },
  'arts-media': { family: 'arts-media', educationRequirement: 'upper-secondary', credentialBarrier: 0.1, skillDemand: 0.8, physicalIntensity: 0.2, remoteCompatibility: 0.75, incomeCeiling: 3.2, stability: 0.3, automationExposure: 0.55, careerMobility: 0.45, entrepreneurialApplicability: 0.8, internationalTransferability: 0.65, growthOutlook: 0.05 },
  business: { family: 'business', educationRequirement: 'bachelor', credentialBarrier: 0.3, skillDemand: 0.65, physicalIntensity: 0.15, remoteCompatibility: 0.8, incomeCeiling: 3.6, stability: 0.6, automationExposure: 0.45, careerMobility: 0.8, entrepreneurialApplicability: 0.85, internationalTransferability: 0.8, growthOutlook: 0.15 },
  construction: { family: 'construction', educationRequirement: 'lower-secondary', credentialBarrier: 0.25, skillDemand: 0.55, physicalIntensity: 0.9, remoteCompatibility: 0.02, incomeCeiling: 1.9, stability: 0.4, automationExposure: 0.35, careerMobility: 0.45, entrepreneurialApplicability: 0.75, internationalTransferability: 0.55, growthOutlook: 0.0 },
  education: { family: 'education', educationRequirement: 'bachelor', credentialBarrier: 0.7, skillDemand: 0.6, physicalIntensity: 0.3, remoteCompatibility: 0.55, incomeCeiling: 2.0, stability: 0.85, automationExposure: 0.3, careerMobility: 0.4, entrepreneurialApplicability: 0.4, internationalTransferability: 0.6, growthOutlook: 0.05 },
  engineering: { family: 'engineering', educationRequirement: 'bachelor', credentialBarrier: 0.6, skillDemand: 0.85, physicalIntensity: 0.3, remoteCompatibility: 0.7, incomeCeiling: 3.4, stability: 0.75, automationExposure: 0.3, careerMobility: 0.75, entrepreneurialApplicability: 0.6, internationalTransferability: 0.85, growthOutlook: 0.25 },
  finance: { family: 'finance', educationRequirement: 'bachelor', credentialBarrier: 0.55, skillDemand: 0.8, physicalIntensity: 0.1, remoteCompatibility: 0.85, incomeCeiling: 4.2, stability: 0.55, automationExposure: 0.6, careerMobility: 0.85, entrepreneurialApplicability: 0.65, internationalTransferability: 0.85, growthOutlook: 0.1 },
  healthcare: { family: 'healthcare', educationRequirement: 'vocational', credentialBarrier: 0.85, skillDemand: 0.85, physicalIntensity: 0.6, remoteCompatibility: 0.1, incomeCeiling: 3.0, stability: 0.9, automationExposure: 0.15, careerMobility: 0.6, entrepreneurialApplicability: 0.35, internationalTransferability: 0.7, growthOutlook: 0.35 },
  hospitality: { family: 'hospitality', educationRequirement: 'primary', credentialBarrier: 0.05, skillDemand: 0.4, physicalIntensity: 0.75, remoteCompatibility: 0.03, incomeCeiling: 1.5, stability: 0.35, automationExposure: 0.45, careerMobility: 0.5, entrepreneurialApplicability: 0.8, internationalTransferability: 0.6, growthOutlook: 0.1 },
  'law-public-policy': { family: 'law-public-policy', educationRequirement: 'master', credentialBarrier: 0.9, skillDemand: 0.8, physicalIntensity: 0.15, remoteCompatibility: 0.6, incomeCeiling: 4.0, stability: 0.7, automationExposure: 0.4, careerMobility: 0.7, entrepreneurialApplicability: 0.55, internationalTransferability: 0.35, growthOutlook: 0.05 },
  manufacturing: { family: 'manufacturing', educationRequirement: 'lower-secondary', credentialBarrier: 0.2, skillDemand: 0.6, physicalIntensity: 0.8, remoteCompatibility: 0.05, incomeCeiling: 2.0, stability: 0.5, automationExposure: 0.75, careerMobility: 0.45, entrepreneurialApplicability: 0.5, internationalTransferability: 0.55, growthOutlook: -0.1 },
  'sales-marketing': { family: 'sales-marketing', educationRequirement: 'upper-secondary', credentialBarrier: 0.1, skillDemand: 0.6, physicalIntensity: 0.2, remoteCompatibility: 0.75, incomeCeiling: 3.2, stability: 0.4, automationExposure: 0.5, careerMobility: 0.8, entrepreneurialApplicability: 0.75, internationalTransferability: 0.75, growthOutlook: 0.15 },
  'science-research': { family: 'science-research', educationRequirement: 'master', credentialBarrier: 0.7, skillDemand: 0.9, physicalIntensity: 0.2, remoteCompatibility: 0.65, incomeCeiling: 3.0, stability: 0.6, automationExposure: 0.25, careerMobility: 0.55, entrepreneurialApplicability: 0.45, internationalTransferability: 0.85, growthOutlook: 0.2 },
  'skilled-trades': { family: 'skilled-trades', educationRequirement: 'lower-secondary', credentialBarrier: 0.45, skillDemand: 0.8, physicalIntensity: 0.8, remoteCompatibility: 0.03, incomeCeiling: 2.3, stability: 0.65, automationExposure: 0.25, careerMobility: 0.5, entrepreneurialApplicability: 0.85, internationalTransferability: 0.6, growthOutlook: 0.15 },
  technology: { family: 'technology', educationRequirement: 'short-cycle-tertiary', credentialBarrier: 0.35, skillDemand: 0.9, physicalIntensity: 0.1, remoteCompatibility: 0.92, incomeCeiling: 4.5, stability: 0.6, automationExposure: 0.35, careerMobility: 0.85, entrepreneurialApplicability: 0.8, internationalTransferability: 0.92, growthOutlook: 0.4 },
  'transport-logistics': { family: 'transport-logistics', educationRequirement: 'lower-secondary', credentialBarrier: 0.3, skillDemand: 0.5, physicalIntensity: 0.7, remoteCompatibility: 0.08, incomeCeiling: 1.8, stability: 0.5, automationExposure: 0.7, careerMobility: 0.4, entrepreneurialApplicability: 0.65, internationalTransferability: 0.55, growthOutlook: 0.05 },
  'service-work': { family: 'service-work', educationRequirement: 'primary', credentialBarrier: 0.03, skillDemand: 0.3, physicalIntensity: 0.65, remoteCompatibility: 0.02, incomeCeiling: 1.3, stability: 0.4, automationExposure: 0.5, careerMobility: 0.4, entrepreneurialApplicability: 0.5, internationalTransferability: 0.35, growthOutlook: 0.1 },
  'military-security': { family: 'military-security', educationRequirement: 'upper-secondary', credentialBarrier: 0.4, skillDemand: 0.5, physicalIntensity: 0.85, remoteCompatibility: 0.02, incomeCeiling: 1.9, stability: 0.8, automationExposure: 0.2, careerMobility: 0.35, entrepreneurialApplicability: 0.25, internationalTransferability: 0.3, growthOutlook: 0.0 },
  other: { family: 'other', educationRequirement: 'upper-secondary', credentialBarrier: 0.2, skillDemand: 0.5, physicalIntensity: 0.4, remoteCompatibility: 0.4, incomeCeiling: 2.0, stability: 0.5, automationExposure: 0.5, careerMobility: 0.5, entrepreneurialApplicability: 0.5, internationalTransferability: 0.5, growthOutlook: 0.0 },
}

const EDUCATION_RANK: Record<string, number> = {
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

export type SwitchDifficulty =
  | 'easy'
  | 'moderate'
  | 'difficult'
  | 'major-retraining'
  | 'credential-gated'

export interface SwitchAssessment {
  from: OccupationFamily
  to: OccupationFamily
  difficulty: SwitchDifficulty
  /** 0–1: higher = further away. Derived, rounded bands only — no false precision. */
  distance: number
  /** Skill overlap 0–1: how much of the current skill level carries over. */
  skillOverlap: number
  /** Years of realistic retraining at part-time intensity. */
  trainingYears: number
  reasons: string[]
}

/**
 * Career-switch distance: how far is family A from family B?
 * Derived from the occupation models (education gate, credential barrier,
 * skill demand, physicality, remoteness) — deliberately banded into honest
 * classifications instead of emitting fake percentages.
 */
export const assessSwitch = (
  from: OccupationFamily,
  to: OccupationFamily,
  userEducation: EducationLevel | undefined,
): SwitchAssessment => {
  const a = OCCUPATION_MODELS[from] ?? OCCUPATION_MODELS.other
  const b = OCCUPATION_MODELS[to] ?? OCCUPATION_MODELS.other
  const reasons: string[] = []
  if (from === to) {
    return {
      from,
      to,
      difficulty: 'easy',
      distance: 0,
      skillOverlap: 1,
      trainingYears: 0,
      reasons: ['Same occupation family — this is a job change, not a switch'],
    }
  }

  const eduRank = EDUCATION_RANK[userEducation ?? 'upper-secondary'] ?? 3
  const educationGap = clamp(((EDUCATION_RANK[b.educationRequirement] ?? 3) - eduRank) / 4, 0, 1)
  const credentialJump = clamp(b.credentialBarrier - a.credentialBarrier * 0.5, 0, 1)
  const skillDistance = Math.abs(b.skillDemand - a.skillDemand) * 0.6
  const physicalDistance = Math.abs(b.physicalIntensity - a.physicalIntensity) * 0.4
  const remoteDistance = Math.abs(b.remoteCompatibility - a.remoteCompatibility) * 0.25

  const distance = clamp(
    educationGap * 0.4 + credentialJump * 0.25 + skillDistance + physicalDistance + remoteDistance,
    0,
    1,
  )

  const skillOverlap = clamp(1 - distance * 0.8, 0.15, 1)
  const trainingYears = distance < 0.3 ? 0.5 : distance < 0.5 ? 1 : distance < 0.7 ? 2 : 3

  let difficulty: SwitchDifficulty
  if (credentialJump > 0.45 && b.credentialBarrier >= 0.7) {
    difficulty = 'credential-gated'
  } else if (distance >= 0.65 || educationGap > 0.5) {
    difficulty = 'major-retraining'
  } else if (distance >= 0.45) {
    difficulty = 'difficult'
  } else if (distance >= 0.22) {
    difficulty = 'moderate'
  } else {
    difficulty = 'easy'
  }

  if (educationGap > 0.2) reasons.push(`+ needs education above what you hold (model gate: ${b.educationRequirement.replace(/-/g, ' ')})`)
  if (b.credentialBarrier >= 0.7) reasons.push('+ credentials strongly gate entry in this field')
  if (b.skillDemand > 0.75) reasons.push('+ progression is skill-driven — your learning history matters')
  if (Math.abs(b.physicalIntensity - a.physicalIntensity) > 0.4) {
    reasons.push(b.physicalIntensity > a.physicalIntensity ? '+ much more physical work' : '+ much less physical work')
  }
  if (b.remoteCompatibility > 0.7 && a.remoteCompatibility < 0.3) reasons.push('+ could open remote work')
  if (b.growthOutlook > 0.2) reasons.push('+ sector demand trend is positive in the model')
  if (b.growthOutlook < -0.15) reasons.push('+ sector demand trend is declining in the model')

  return { from, to, difficulty, distance, skillOverlap, trainingYears, reasons }
}

/** Predicted income effect of a switch, as a multiplier on current expected income. */
export const switchIncomeEffect = (from: OccupationFamily, to: OccupationFamily): { ratio: number; note: string } => {
  const a = OCCUPATION_MODELS[from] ?? OCCUPATION_MODELS.other
  const b = OCCUPATION_MODELS[to] ?? OCCUPATION_MODELS.other
  const ceilingRatio = clamp(b.incomeCeiling / Math.max(a.incomeCeiling, 0.5), 0.4, 2.5)
  const note =
    ceilingRatio > 1.2
      ? 'higher income potential in the long run'
      : ceilingRatio < 0.85
        ? 'lower income ceiling than your current field'
        : 'similar long-run income range'
  return { ratio: clamp(0.7 + ceilingRatio * 0.3, 0.6, 1.6), note }
}
