import { describe, expect, it } from 'vitest'
import {
  EDUCATION_LEVELS,
  EMPLOYMENT_STATUSES,
  HOUSING_STATES,
  OCCUPATION_FAMILIES,
  RELATIONSHIP_STATUSES,
  SENIORITY_LEVELS,
  SETTLEMENT_TYPES,
  taxonomyLabel,
} from '@/domain/taxonomies'

/** Taxonomies must stay unique and labelled — UI and data both key off their ids. */
describe('taxonomies', () => {
  const taxonomies = {
    EDUCATION_LEVELS,
    EMPLOYMENT_STATUSES,
    OCCUPATION_FAMILIES,
    SETTLEMENT_TYPES,
    RELATIONSHIP_STATUSES,
    HOUSING_STATES,
    SENIORITY_LEVELS,
  } as const

  for (const [name, terms] of Object.entries(taxonomies)) {
    it(`${name} has unique ids and non-empty labels`, () => {
      const ids = terms.map((term) => term.id)
      expect(new Set(ids).size).toBe(ids.length)
      for (const term of terms) {
        expect(term.label.length).toBeGreaterThan(0)
      }
    })
  }

  it('covers the globally required education spectrum', () => {
    const ids = EDUCATION_LEVELS.map((term) => term.id)
    expect(ids).toContain('none')
    expect(ids).toContain('primary')
    expect(ids).toContain('bachelor')
    expect(ids).toContain('doctorate')
    expect(ids).toContain('professional-certification')
  })

  it('includes non-western employment realities', () => {
    const ids = EMPLOYMENT_STATUSES.map((term) => term.id)
    expect(ids).toContain('informal')
    expect(ids).toContain('gig-freelance')
    expect(ids).toContain('caregiver')
  })

  it('looks up labels by id', () => {
    expect(taxonomyLabel(SETTLEMENT_TYPES, 'major-city')).toBe('Major city')
    expect(taxonomyLabel(SETTLEMENT_TYPES, 'nonexistent' as never)).toBeUndefined()
  })
})
