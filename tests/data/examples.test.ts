import { describe, expect, it } from 'vitest'
import { EXAMPLE_PROFILES } from '@/data/example-profiles'
import { getCountryProfile } from '@/data/countries'
import { validateProfile } from '@/domain/validation'
import { hasBlockingIssues } from '@/domain/validation'

describe('example profiles', () => {
  it('provides at least six clearly-fictional lives', () => {
    expect(EXAMPLE_PROFILES.length).toBeGreaterThanOrEqual(6)
    for (const { profile } of EXAMPLE_PROFILES) {
      expect(profile.isFictional).toBe(true)
      expect(profile.displayName).toMatch(/fictional example/)
    }
  })

  it('has unique ids and valid countries with matching currencies', () => {
    const ids = EXAMPLE_PROFILES.map(({ profile }) => profile.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const { profile } of EXAMPLE_PROFILES) {
      const country = getCountryProfile(profile.demographics.countryOfResidence)
      expect(country, profile.id).toBeDefined()
      const income = profile.employment?.grossIncome
      if (income?.kind === 'known') {
        expect(income.value.currency).toBe(country!.identity.currency)
      }
      const savings = profile.finances?.savings
      if (savings?.kind === 'known') {
        expect(savings.value.currency).toBe(country!.identity.currency)
      }
    }
  })

  it('covers meaningfully different contexts', () => {
    const statuses = new Set(EXAMPLE_PROFILES.map(({ profile }) => profile.employment?.status))
    expect(statuses).toContain('student')
    expect(statuses).toContain('self-employed')
    expect(statuses).toContain('informal')
    const regions = new Set(
      EXAMPLE_PROFILES.map(({ profile }) => getCountryProfile(profile.demographics.countryOfResidence)?.identity.region),
    )
    expect(regions.size).toBeGreaterThanOrEqual(4)
  })

  it('none of the examples produce blocking validation errors', () => {
    for (const { profile } of EXAMPLE_PROFILES) {
      expect(hasBlockingIssues(validateProfile(profile)), profile.id).toBe(false)
    }
  })

  it('every example has coherent demographics', () => {
    for (const { profile } of EXAMPLE_PROFILES) {
      const age = profile.demographics.age
      expect(age?.kind).toBe('known')
      if (age?.kind === 'known') {
        expect(age.value).toBeGreaterThanOrEqual(16)
        expect(age.value).toBeLessThanOrEqual(75)
      }
      expect(profile.demographics.citizenships.length).toBeGreaterThan(0)
    }
  })
})
