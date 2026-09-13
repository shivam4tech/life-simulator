import { describe, expect, it } from 'vitest'
import {
  CHAOS_LEVELS,
  CHAOS_MODIFIERS,
  generateRandomLife,
  simulateLife,
  exportLifeJson,
  importLifeJson,
  sanitiseForShare,
  type SimulationConfig,
} from '@/simulation'
import { DEMO_PROFILE } from '@/data/demo-profile'
import { listCountryProfiles } from '@/data/countries'

const config = (chaos?: SimulationConfig['chaosLevel']): SimulationConfig => ({
  seed: 'chaos-universe',
  worldScenario: 'stable',
  chaosLevel: chaos ?? 'realistic',
  horizonYears: 20,
  startCalendarYear: 2026,
})

describe('chaos setting', () => {
  it('has four levels with sensible modifier ordering', () => {
    expect(CHAOS_LEVELS).toHaveLength(4)
    expect(CHAOS_MODIFIERS.calm.disruptionMultiplier).toBeLessThan(CHAOS_MODIFIERS.realistic.disruptionMultiplier)
    expect(CHAOS_MODIFIERS.realistic.disruptionMultiplier).toBeLessThan(CHAOS_MODIFIERS.volatile.disruptionMultiplier)
    expect(CHAOS_MODIFIERS.volatile.rareEventMultiplier).toBeLessThan(CHAOS_MODIFIERS.wild.rareEventMultiplier)
    expect(CHAOS_MODIFIERS.realistic.disruptionMultiplier).toBe(1)
    expect(CHAOS_MODIFIERS.realistic.rareEventMultiplier).toBe(1)
  })

  it('calm worlds produce fewer recession events than wild worlds (statistically)', () => {
    let calmRecessions = 0
    let wildRecessions = 0
    const lives = 60
    for (let i = 0; i < lives; i++) {
      const calm = simulateLife(DEMO_PROFILE, config('calm'), i)
      const wild = simulateLife(DEMO_PROFILE, config('wild'), i)
      calmRecessions += calm.events.filter((e) => e.type === 'recession').length
      wildRecessions += wild.events.filter((e) => e.type === 'recession').length
    }
    expect(wildRecessions).toBeGreaterThan(calmRecessions)
  })

  it('chaos does not break determinism or numerical invariants', () => {
    for (const level of ['calm', 'wild'] as const) {
      const a = simulateLife(DEMO_PROFILE, config(level), 33)
      const b = simulateLife(DEMO_PROFILE, config(level), 33)
      expect(JSON.stringify(a.snapshots)).toBe(JSON.stringify(b.snapshots))
      for (const snapshot of a.snapshots) {
        expect(Number.isFinite(snapshot.netWorth)).toBe(true)
        expect(snapshot.debt).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

describe('random life generator', () => {
  it('generates finite, well-formed lives for many seeds', () => {
    const countries = new Set<string>()
    for (let i = 0; i < 50; i++) {
      const life = generateRandomLife(`random-${i}`)
      expect(life.isFictional).toBe(true)
      expect(life.demographics.countryOfResidence).toBeTruthy()
      countries.add(life.demographics.countryOfResidence)
      const age = life.demographics.age
      expect(age?.kind).toBe('known')
      if (age?.kind === 'known') {
        expect(age.value).toBeGreaterThanOrEqual(18)
        expect(age.value).toBeLessThanOrEqual(64)
      }
      // Financial quantities must be finite
      const savings = life.finances?.savings
      if (savings?.kind === 'known') {
        expect(Number.isFinite(savings.value.value)).toBe(true)
        expect(savings.value.value).toBeGreaterThanOrEqual(0)
      }
    }
    // Across 50 lives, multiple countries should appear
    expect(countries.size).toBeGreaterThan(5)
  })

  it('is deterministic for the same seed', () => {
    const a = generateRandomLife('determinism-check')
    const b = generateRandomLife('determinism-check')
    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })

  it('different seeds produce different lives', () => {
    const a = generateRandomLife('seed-a')
    const b = generateRandomLife('seed-b')
    expect(JSON.stringify(a.demographics)).not.toBe(JSON.stringify(b.demographics))
  })

  it('references real registry countries', () => {
    const registry = new Set(listCountryProfiles().map((c) => c.identity.code))
    for (let i = 0; i < 20; i++) {
      const life = generateRandomLife(i)
      expect(registry.has(life.demographics.countryOfResidence)).toBe(true)
    }
  })
})

describe('save slots & export/import', () => {
  it('strips display name and city for privacy-safe sharing', () => {
    const shared = sanitiseForShare(DEMO_PROFILE)
    expect(shared.displayName).toBeUndefined()
    expect(shared.demographics.city).toBeUndefined()
    expect(shared.demographics.region).toBeUndefined()
    // Non-identifying fields must survive
    expect(shared.demographics.countryOfResidence).toBe(DEMO_PROFILE.demographics.countryOfResidence)
    expect(shared.finances).toEqual(DEMO_PROFILE.finances)
  })

  it('export → import round-trips a profile', () => {
    const json = exportLifeJson(DEMO_PROFILE)
    const restored = importLifeJson(json)
    expect(restored).not.toBeNull()
    expect(restored!.demographics.countryOfResidence).toBe(DEMO_PROFILE.demographics.countryOfResidence)
    expect(restored!.finances).toEqual(DEMO_PROFILE.finances)
  })

  it('rejects malformed JSON payloads', () => {
    expect(importLifeJson('not json')).toBeNull()
    expect(importLifeJson('{"kind": "other"}')).toBeNull()
    expect(importLifeJson('{}')).toBeNull()
  })
})
