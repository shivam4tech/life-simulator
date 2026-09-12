import { describe, expect, it } from 'vitest'
import { hasBlockingIssues, validateProfile } from '@/domain/validation'
import { known, unknownValue, range } from '@/domain/values'
import { monthlyMoney } from '@/domain/money'
import { emptyDraft } from '@/app/store/onboarding'
import type { PersonProfile } from '@/domain/person'

const profileWith = (over: Partial<PersonProfile>): PersonProfile => {
  const base = emptyDraft()
  return {
    ...base,
    ...over,
    demographics: { ...base.demographics, countryOfResidence: 'GH', age: known(30), ...over.demographics },
  }
}

describe('profile validation', () => {
  it('a sensible profile produces no issues', () => {
    const issues = validateProfile(
      profileWith({
        employment: {
          status: 'employed',
          seniority: 'mid',
          yearsExperience: known(6),
          grossIncome: known(monthlyMoney(9000, 'GHS')),
        },
        education: { level: 'bachelor', yearsSinceCompletion: known(5) },
      }),
    )
    expect(issues).toEqual([])
  })

  it('missing country is a blocking error', () => {
    const draft = emptyDraft()
    const issues = validateProfile(draft)
    expect(hasBlockingIssues(issues)).toBe(true)
    expect(issues.find((issue) => issue.id === 'country-missing')).toBeDefined()
  })

  it('impossible age is a blocking error', () => {
    const issues = validateProfile(profileWith({ demographics: { countryOfResidence: 'GH', age: known(-4), citizenships: [] } }))
    expect(issues.find((issue) => issue.id === 'age-out-of-range')?.severity).toBe('error')
    expect(hasBlockingIssues(issues)).toBe(true)
  })

  it('negative money is a blocking error', () => {
    const issues = validateProfile(
      profileWith({ finances: { savings: known(monthlyMoney(-500, 'GHS')) } }),
    )
    expect(issues.find((issue) => issue.id === 'money-negative')?.severity).toBe('error')
  })

  it('age 15 with 30 years experience warns but does not block', () => {
    const issues = validateProfile(
      profileWith({
        demographics: { countryOfResidence: 'GH', age: known(15), citizenships: [] },
        employment: { yearsExperience: known(30) },
      }),
    )
    const issue = issues.find((entry) => entry.id === 'age-experience')
    expect(issue?.severity).toBe('warning')
    expect(hasBlockingIssues(issues)).toBe(false)
  })

  it('executive role without formal education warns but does not block', () => {
    const issues = validateProfile(
      profileWith({
        education: { level: 'none' },
        employment: { seniority: 'executive-specialist', status: 'employed' },
      }),
    )
    expect(issues.find((issue) => issue.id === 'education-seniority')).toBeDefined()
    expect(hasBlockingIssues(issues)).toBe(false)
  })

  it('retired at 32 is allowed with a warning', () => {
    const issues = validateProfile(
      profileWith({ employment: { status: 'retired' } , demographics: { countryOfResidence: 'GH', age: known(32), citizenships: [] } }),
    )
    expect(issues.find((issue) => issue.id === 'retired-young')).toBeDefined()
    expect(hasBlockingIssues(issues)).toBe(false)
  })

  it('unknowns never block — a mostly-empty profile is savable', () => {
    const draft = emptyDraft()
    const profile: PersonProfile = {
      ...draft,
      demographics: { ...draft.demographics, countryOfResidence: 'IN', age: unknownValue() },
    }
    const issues = validateProfile(profile)
    expect(hasBlockingIssues(issues)).toBe(false)
    expect(issues.some((issue) => issue.id === 'sparse-core')).toBe(true)
  })

  it('ranges are accepted for money-like numeric inputs', () => {
    const issues = validateProfile(
      profileWith({
        employment: { yearsExperience: range(3, 7) },
      }),
    )
    expect(issues.find((issue) => issue.id === 'age-experience')).toBeUndefined()
  })

  it('heavy housing burden produces an info note', () => {
    const issues = validateProfile(
      profileWith({
        employment: { grossIncome: known(monthlyMoney(2000, 'GHS')) },
        finances: { housingCost: known(monthlyMoney(1500, 'GHS')) },
      }),
    )
    expect(issues.find((issue) => issue.id === 'housing-burden')).toBeDefined()
  })
})
