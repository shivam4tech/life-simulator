import { describe, expect, it } from 'vitest'
import { getCountryProfile, listCountryProfiles, searchCountries } from '@/data/countries'
import { ARCHETYPE_BASELINES } from '@/data/country-archetypes'
import { DEMO_PROFILE } from '@/data/demo-profile'

const ALL_ASSUMPTION_KEYS = [
  'incomeLevel',
  'priceLevel',
  'inequality',
  'unemploymentRate',
  'labourMarketStrength',
  'housingAffordability',
  'healthcareAccess',
  'educationAccess',
  'socialSafetyNet',
  'institutionalStability',
  'migrationAttractiveness',
  'economicVolatility',
] as const

describe('country registry', () => {
  const profiles = listCountryProfiles()

  it('covers every inhabited region', () => {
    const regions = new Set(profiles.map((profile) => profile.identity.region))
    for (const region of ['africa', 'asia', 'europe', 'north-america', 'south-america', 'oceania']) {
      expect(regions.has(region as never)).toBe(true)
    }
  })

  it('has unique country codes and valid currency/locale fields', () => {
    const codes = profiles.map((profile) => profile.identity.code)
    expect(new Set(codes).size).toBe(codes.length)
    for (const profile of profiles) {
      expect(profile.identity.code).toMatch(/^[A-Z]{2}$/)
      expect(profile.identity.currency).toMatch(/^[A-Z]{3}$/)
      expect(profile.identity.locale).toMatch(/^[a-z]{2}(-[A-Za-z0-9]+)?$/)
      expect(profile.identity.primaryLanguages.length).toBeGreaterThan(0)
    }
  })

  it('resolves assumptions inside 0–1 bounds with no NaN/Infinity', () => {
    for (const profile of profiles) {
      for (const key of ALL_ASSUMPTION_KEYS) {
        const value = profile.assumptions[key]
        expect(Number.isFinite(value), `${profile.identity.code} ${key}`).toBe(true)
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })

  it('marks every assumption set as placeholder provenance', () => {
    for (const profile of profiles) {
      expect(profile.provenance.source).toBe('internal placeholder model')
      expect(profile.provenance.confidence).toBe('placeholder')
      expect(profile.provenance.referenceYear).toBeNull()
    }
  })

  it('applies country overrides on top of archetypes', () => {
    const ghana = getCountryProfile('GH')
    expect(ghana).toBeDefined()
    const baseline = ARCHETYPE_BASELINES[ghana!.archetype]
    // Ghana overrides incomeLevel upward relative to its archetype.
    expect(ghana!.assumptions.incomeLevel).not.toBe(baseline.incomeLevel)
    expect(ghana!.assumptions.incomeLevel).toBeGreaterThan(baseline.incomeLevel)
  })

  it('resolves lookups case-insensitively and rejects unknown codes', () => {
    expect(getCountryProfile('de')?.identity.name).toBe('Germany')
    expect(getCountryProfile('XX')).toBeUndefined()
  })

  it('searches by name and currency', () => {
    expect(searchCountries('germ').map((profile) => profile.identity.code)).toContain('DE')
    expect(searchCountries('INR').map((profile) => profile.identity.code)).toContain('IN')
  })
})

describe('demo profile', () => {
  it('is clearly fictional and references a real registry country', () => {
    expect(DEMO_PROFILE.isFictional).toBe(true)
    expect(getCountryProfile(DEMO_PROFILE.demographics.countryOfResidence)).toBeDefined()
  })

  it('keeps money values in the country currency', () => {
    const currency = getCountryProfile(DEMO_PROFILE.demographics.countryOfResidence)!.identity.currency
    expect(DEMO_PROFILE.employment?.grossIncome?.kind).toBe('known')
    if (DEMO_PROFILE.employment?.grossIncome?.kind === 'known') {
      expect(DEMO_PROFILE.employment.grossIncome.value.currency).toBe(currency)
    }
  })
})
