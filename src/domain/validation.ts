import type { MaybeMoney, PersonProfile } from './person'
import { isKnown, resolveMaybe } from './values'

/**
 * Profile validation — prevent nonsense, allow unusual lives.
 *
 * Reality is strange: massive debt, zero income, retired at 32, living with
 * parents at 55 and executive roles without formal education are all allowed.
 * The validator therefore emits mostly *warnings*; only genuinely impossible
 * values are *errors* (which block saving until fixed).
 */

export type IssueSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  id: string
  message: string
  severity: IssueSeverity
  /** Onboarding chapter the user can jump to in order to fix it. */
  stepId?: string
}

const ERROR = (id: string, message: string, stepId?: string): ValidationIssue => ({
  id,
  message,
  severity: 'error',
  stepId,
})
const WARN = (id: string, message: string, stepId?: string): ValidationIssue => ({
  id,
  message,
  severity: 'warning',
  stepId,
})
const INFO = (id: string, message: string, stepId?: string): ValidationIssue => ({
  id,
  message,
  severity: 'info',
  stepId,
})

const moneyValues = (profile: PersonProfile): { path: string; value: number }[] => {
  const finances = profile.finances ?? {}
  const employment = profile.employment ?? {}
  const entries: { path: string; value: number }[] = []
  const push = (path: string, amount: MaybeMoney | undefined) => {
    if (amount && isKnown(amount)) entries.push({ path, value: amount.value.value })
  }
  push('employment.grossIncome', employment.grossIncome)
  push('finances.savings', finances.savings)
  push('finances.emergencySavings', finances.emergencySavings)
  push('finances.investments', finances.investments)
  push('finances.majorAssets', finances.majorAssets)
  push('finances.debt', finances.debt)
  push('finances.housingCost', finances.housingCost)
  push('finances.essentialMonthlyExpenses', finances.essentialMonthlyExpenses)
  push('finances.discretionaryMonthlySpending', finances.discretionaryMonthlySpending)
  return entries
}

export const validateProfile = (profile: PersonProfile): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const age = resolveMaybe(profile.demographics.age)
  const education = profile.education
  const employment = profile.employment
  const finances = profile.finances

  // --- Hard errors: genuinely impossible values ---
  if (age !== null && (!Number.isFinite(age) || age < 1 || age > 100)) {
    issues.push(ERROR('age-out-of-range', 'Age must be between 1 and 100.', 'you'))
  }

  for (const { path, value } of moneyValues(profile)) {
    if (!Number.isFinite(value) || value < 0) {
      issues.push(ERROR('money-negative', `Money values cannot be negative (check ${path.split('.').pop()}).`, 'money'))
      break
    }
  }

  const countryKnown = profile.demographics.countryOfResidence !== ''
  if (!countryKnown) {
    issues.push(ERROR('country-missing', 'Select a country of residence so the simulator knows your currency and context.', 'where'))
  }

  // --- Warnings: unusual, but real lives can look like this ---
  const yearsExperience = employment?.yearsExperience ? resolveMaybe(employment.yearsExperience) : null
  if (age !== null && yearsExperience !== null && age - yearsExperience < 14) {
    issues.push(
      WARN(
        'age-experience',
        `${yearsExperience} years of experience at age ${age} means starting work very young. Kept as entered.`,
        'work',
      ),
    )
  }

  if (
    age !== null &&
    age < 20 &&
    education?.level !== undefined &&
    ['master', 'doctorate'].includes(education.level)
  ) {
    issues.push(WARN('age-education', `A ${education.level}-equivalent qualification before age 20 is unusual. Kept as entered.`, 'education'))
  }

  if (
    education?.level !== undefined &&
    ['none', 'primary'].includes(education.level) &&
    employment?.seniority !== undefined &&
    ['management', 'executive-specialist'].includes(employment.seniority)
  ) {
    issues.push(
      WARN('education-seniority', 'Senior leadership with little formal education is unusual, but reality allows it.', 'work'),
    )
  }

  if (employment?.status === 'retired' && age !== null && age < 40) {
    issues.push(WARN('retired-young', `Retired at ${age} is uncommon — the simulator will treat it as an early-retirement path.`, 'work'))
  }

  const yearsSince = education?.yearsSinceCompletion ? resolveMaybe(education.yearsSinceCompletion) : null
  if (age !== null && yearsSince !== null && yearsSince > age - 12) {
    issues.push(WARN('completion-age', 'Years since qualification completion looks long for this age. Kept as entered.', 'education'))
  }

  const hours = employment?.hoursPerWeek ? resolveMaybe(employment.hoursPerWeek) : null
  if (age !== null && age < 16 && hours !== null && hours > 25) {
    issues.push(WARN('hours-young', 'Very high working hours for someone under 16.', 'work'))
  }

  // --- Info: contextual notes that help the simulator be specific ---
  if (age === null || !countryKnown) {
    issues.push(INFO('sparse-core', 'With age or country unknown, simulated futures will be less specific.', 'you'))
  }

  const income = employment?.grossIncome
  const housingCost = finances?.housingCost
  if (
    income &&
    housingCost &&
    isKnown(income) &&
    isKnown(housingCost) &&
    income.value.currency === housingCost.value.currency &&
    income.value.value > 0 &&
    housingCost.value.value > income.value.value * 0.6
  ) {
    issues.push(
      INFO('housing-burden', 'Housing cost is more than 60% of gross income — a heavy but real burden the simulator will reflect.', 'money'),
    )
  }

  return issues
}

/** Only these block saving; everything else is surfaced as guidance. */
export const hasBlockingIssues = (issues: ValidationIssue[]): boolean =>
  issues.some((issue) => issue.severity === 'error')
