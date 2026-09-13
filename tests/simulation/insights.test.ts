import { describe, expect, it } from 'vitest'
import { deriveLifeDrivers, derivePressures } from '@/simulation/insights'
import { runMonteCarlo } from '@/simulation/runner'
import type { SimulationConfig } from '@/simulation'
import { DEMO_PROFILE } from '@/data/demo-profile'

const config = (over: Partial<SimulationConfig> = {}): SimulationConfig => ({
  seed: 'insight-universe',
  worldScenario: 'stable',
  horizonYears: 25,
  startCalendarYear: 2026,
  ...over,
})

describe('life drivers ("why did this life happen?")', () => {
  const run = runMonteCarlo(DEMO_PROFILE, config(), { numLives: 60 })

  it('derives ranked, finite drivers for every representative life', () => {
    for (const { result } of run.representative) {
      const drivers = deriveLifeDrivers(result)
      expect(drivers.length).toBeGreaterThan(0)
      expect(drivers.length).toBeLessThanOrEqual(5)
      for (let i = 1; i < drivers.length; i++) {
        expect(drivers[i - 1]!.weight).toBeGreaterThanOrEqual(drivers[i]!.weight)
        expect(Number.isFinite(drivers[i]!.weight)).toBe(true)
      }
      // Evidence must be non-empty strings.
      for (const driver of drivers) {
        expect(driver.label.length).toBeGreaterThan(0)
        expect(driver.evidence.length).toBeGreaterThan(0)
      }
    }
  })

  it('is deterministic for the same result', () => {
    const { result } = run.representative[0]!
    expect(JSON.stringify(deriveLifeDrivers(result))).toBe(
      JSON.stringify(deriveLifeDrivers(result)),
    )
  })

  it('survives an empty one-year life', () => {
    const tiny = runMonteCarlo(DEMO_PROFILE, config({ horizonYears: 1, seed: 'tiny' }), { numLives: 1 })
    const drivers = deriveLifeDrivers(tiny.representative[0]!.result)
    expect(Array.isArray(drivers)).toBe(true)
  })
})

describe('pressures ("top active pressures")', () => {
  it('derives at most three pressures at every age of a turbulent life', () => {
    const run = runMonteCarlo(DEMO_PROFILE, config({ worldScenario: 'volatile', horizonYears: 20, seed: 'turbulent' }), {
      numLives: 30,
    })
    const { result } = run.representative[0]!
    for (let t = 0; t < result.snapshots.length; t++) {
      const pressures = derivePressures(result, t)
      expect(pressures.length).toBeLessThanOrEqual(3)
      for (const pressure of pressures) {
        expect(pressure.label.length).toBeGreaterThan(0)
      }
    }
  })
})
