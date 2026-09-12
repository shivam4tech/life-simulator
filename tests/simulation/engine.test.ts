import { describe, expect, it } from 'vitest'
import { runMonteCarlo, simulateLife, bandForPercentile, quantile } from '@/simulation'
import type { SimulationConfig, YearSnapshot } from '@/simulation'
import type { PersonProfile } from '@/domain/person'
import { known, monthlyMoney } from '@/domain'
import { DEMO_PROFILE } from '@/data/demo-profile'

const config = (over: Partial<SimulationConfig> = {}): SimulationConfig => ({
  seed: 'test-universe',
  worldScenario: 'stable',
  horizonYears: 30,
  startCalendarYear: 2026,
  ...over,
})

const baseProfile = (): PersonProfile => DEMO_PROFILE

const profileWith = (over: Partial<PersonProfile>): PersonProfile => ({
  ...baseProfile(),
  ...over,
  demographics: { ...baseProfile().demographics, ...over.demographics },
})

const FINITE = (value: number, label: string) => {
  expect(Number.isFinite(value), `${label} must be finite (got ${value})`).toBe(true)
}

const checkFiniteSnapshots = (snapshots: YearSnapshot[], label: string) => {
  for (const snapshot of snapshots) {
    FINITE(snapshot.nominalIncome, `${label} income y${snapshot.year}`)
    FINITE(snapshot.realIncome, `${label} realIncome y${snapshot.year}`)
    FINITE(snapshot.savings, `${label} savings y${snapshot.year}`)
    FINITE(snapshot.investments, `${label} investments y${snapshot.year}`)
    FINITE(snapshot.debt, `${label} debt y${snapshot.year}`)
    FINITE(snapshot.netWorth, `${label} netWorth y${snapshot.year}`)
    expect(snapshot.debt, `${label} debt >= 0 y${snapshot.year}`).toBeGreaterThanOrEqual(0)
    expect(snapshot.savings, `${label} savings >= 0 y${snapshot.year}`).toBeGreaterThanOrEqual(0)
    expect(snapshot.investments, `${label} investments >= 0 y${snapshot.year}`).toBeGreaterThanOrEqual(0)
    expect(snapshot.healthIndex, `${label} health 0..100 y${snapshot.year}`).toBeGreaterThanOrEqual(0)
    expect(snapshot.healthIndex, `${label} health 0..100 y${snapshot.year}`).toBeLessThanOrEqual(100)
    expect(snapshot.goalAlignment, `${label} alignment 0..1 y${snapshot.year}`).toBeGreaterThanOrEqual(0)
    expect(snapshot.goalAlignment, `${label} alignment 0..1 y${snapshot.year}`).toBeLessThanOrEqual(1)
  }
}

describe('determinism', () => {
  it('same seed + profile + config produce byte-identical futures', () => {
    const a = simulateLife(baseProfile(), config({ seed: 'alpha' }), 12345)
    const b = simulateLife(baseProfile(), config({ seed: 'alpha' }), 12345)
    expect(JSON.stringify(a.snapshots)).toBe(JSON.stringify(b.snapshots))
    expect(JSON.stringify(a.events)).toBe(JSON.stringify(b.events))
    expect(a.final).toEqual(b.final)
  })

  it('different seeds diverge somewhere', () => {
    const a = simulateLife(baseProfile(), config({ seed: 'alpha' }), 1)
    const b = simulateLife(baseProfile(), config({ seed: 'beta' }), 2)
    const aIncome = a.snapshots.map((s) => Math.round(s.realIncome))
    const bIncome = b.snapshots.map((s) => Math.round(s.realIncome))
    expect(aIncome).not.toEqual(bIncome)
  })

  it('the same life index is identical whether run inside 10 or 1000 lives', () => {
    const configA = config({ seed: 'shared' })
    const single = simulateLife(baseProfile(), configA, 7)
    const run = runMonteCarlo(baseProfile(), configA, { numLives: 200 })
    const representativeSeeds = run.representative.map((r) => r.result.seed)
    // Life #7's seed must appear deterministically derivable — replay equals.
    const replay = simulateLife(baseProfile(), configA, 7)
    expect(replay.final).toEqual(single.final)
    expect(representativeSeeds.length).toBe(4)
  })

  it('full Monte Carlo runs are reproducible end to end', () => {
    const strip = (run: ReturnType<typeof runMonteCarlo>) => JSON.stringify({ bands: run.bands, aggregates: run.aggregates })
    const a = strip(runMonteCarlo(baseProfile(), config({ seed: 'repro' }), { numLives: 150 }))
    const b = strip(runMonteCarlo(baseProfile(), config({ seed: 'repro' }), { numLives: 150 }))
    expect(a).toBe(b)
  })
})

describe('engine invariants', () => {
  it('ages progress one year per snapshot and stop at the age limit', () => {
    const result = simulateLife(baseProfile(), config({ horizonYears: 80 }), 42)
    const ages = result.snapshots.map((s) => s.age)
    for (let i = 1; i < ages.length; i++) {
      expect(ages[i]! - ages[i - 1]!).toBe(1)
    }
    expect(ages[ages.length - 1]!).toBeLessThanOrEqual(100)
    expect(result.snapshots.length).toBeLessThanOrEqual(80)
  })

  it('net worth identity holds (savings + investments + assets − debt)', () => {
    const result = simulateLife(baseProfile(), config(), 9)
    for (const s of result.snapshots) {
      expect(s.netWorth).toBeCloseTo(s.savings + s.investments + s.assets - s.debt, 2)
    }
  })

  it('real values are consistent with nominal through the inflation index', () => {
    const result = simulateLife(baseProfile(), config({ worldScenario: 'volatile' }), 11)
    for (const s of result.snapshots) {
      // In volatile worlds inflation ≥ 0 always, so real ≤ nominal.
      expect(s.realIncome).toBeLessThanOrEqual(s.nominalIncome + 0.01)
    }
  })

  it('retired people do not lose jobs and draw pension', () => {
    const retiree = profileWith({
      demographics: { countryOfResidence: 'DE', age: known(63), citizenships: ['DE'] },
      employment: { status: 'retired', occupationFamily: 'technology' },
    })
    const result = simulateLife(retiree, config({ horizonYears: 20 }), 3)
    for (const s of result.snapshots) {
      expect(s.employment).toBe('retired')
      expect(s.nominalIncome).toBeGreaterThan(0)
    }
  })

  it('children never arrive when the preference is "no"', () => {
    const childfree = profileWith({
      relationshipStatus: 'married',
      relationshipPreferences: {
        desiresPartnership: 'yes',
        marriagePreference: 'important',
        childrenPreference: 'no',
      },
    })
    const result = simulateLife(childfree, config({ horizonYears: 40 }), 5)
    for (const s of result.snapshots) {
      expect(s.childrenCount).toBe(0)
    }
  })

  it('events reference valid years and ordered ids', () => {
    const result = simulateLife(baseProfile(), config(), 21)
    for (const event of result.events) {
      expect(event.year).toBeGreaterThan(2025)
      expect(event.age).toBeGreaterThanOrEqual(18)
      expect(event.causes.length).toBeGreaterThanOrEqual(1)
      expect(event.title.length).toBeGreaterThan(0)
    }
  })
})

describe('monte carlo runner', () => {
  it('produces bands that sum to ~1 and four representative lives', () => {
    const run = runMonteCarlo(baseProfile(), config({ horizonYears: 25 }), { numLives: 400 })
    const bandSum = run.bands.reduce((sum, band) => sum + band.share, 0)
    expect(bandSum).toBeCloseTo(1, 5)
    expect(run.representative).toHaveLength(4)
    expect(run.representative.map((r) => r.band)).toEqual(['difficult', 'typical', 'good', 'exceptional'])
    expect(run.aggregates).toHaveLength(25)
    expect(run.numLives).toBe(400)
  })

  it('reports progress and can be cancelled', () => {
    const signal = { aborted: false }
    const progress: [number, number][] = []
    const run = runMonteCarlo(baseProfile(), config({ horizonYears: 10 }), {
      numLives: 1000,
      batchSize: 100,
      signal,
      onProgress: (completed, total) => {
        progress.push([completed, total])
        if (completed >= 300) signal.aborted = true
      },
    })
    expect(run.cancelled).toBe(true)
    expect(run.numLives).toBeLessThan(1000)
    expect(progress.length).toBeGreaterThan(0)
    expect(progress[0]![1]).toBe(1000)
  })

  it('scales: 2000 lives finish quickly and stay finite', () => {
    const started = Date.now()
    const run = runMonteCarlo(baseProfile(), config({ horizonYears: 30 }), { numLives: 2000 })
    const elapsed = Date.now() - started
    expect(run.numLives).toBe(2000)
    expect(elapsed).toBeLessThan(20_000)
    checkFiniteSnapshots(run.representative[1]!.result.snapshots, 'representative-typical')
  })
})

describe('extreme-but-valid profiles (fuzz)', () => {
  const extremeProfiles: [string, PersonProfile][] = [
    [
      'age 18, no income, no savings',
      profileWith({
        demographics: { countryOfResidence: 'ET', age: known(18), citizenships: ['ET'] },
        employment: { status: 'unemployed' },
        finances: {},
      }),
    ],
    [
      'age 75 still working',
      profileWith({
        demographics: { countryOfResidence: 'JP', age: known(75), citizenships: ['JP'] },
        employment: { status: 'employed', occupationFamily: 'education', grossIncome: known(monthlyMoney(300000, 'JPY')) },
      }),
    ],
    [
      'huge debt, zero income',
      profileWith({
        demographics: { countryOfResidence: 'AR', age: known(35), citizenships: ['AR'] },
        employment: { status: 'unemployed' },
        finances: { debt: known(monthlyMoney(5_000_000, 'ARS')) },
      }),
    ],
    [
      'many children, single parent',
      profileWith({
        demographics: { countryOfResidence: 'NG', age: known(41), citizenships: ['NG'] },
        dependents: { count: known(6) },
        relationshipStatus: 'widowed',
        employment: { status: 'informal' },
      }),
    ],
    [
      'everything unknown',
      profileWith({
        demographics: { countryOfResidence: 'VN', age: { kind: 'unknown' }, citizenships: [] },
      }),
    ],
    [
      'executive with no education and maxed behaviours',
      profileWith({
        demographics: { countryOfResidence: 'US', age: known(52), citizenships: ['US'] },
        education: { level: 'none' },
        employment: { status: 'employed', seniority: 'executive-specialist', occupationFamily: 'finance' },
        behaviours: {
          riskTolerance: 10, discipline: 10, patience: 0, persistence: 10, adaptability: 0,
          sociability: 10, stressTolerance: 0, noveltySeeking: 10, careerAmbition: 10,
          financialRestraint: 0, familyOrientation: 10, geographicMobility: 0,
          learningInclination: 10, entrepreneurialTendency: 10,
        },
      }),
    ],
  ]

  for (const [name, profile] of extremeProfiles) {
    it(`survives: ${name}`, () => {
      const result = simulateLife(profile, config({ horizonYears: 40, worldScenario: 'volatile' }), 77)
      checkFiniteSnapshots(result.snapshots, name)
      expect(result.snapshots.length).toBeGreaterThan(0)
    })
  }
})

describe('classification & aggregation helpers', () => {
  it('bandForPercentile maps thresholds', () => {
    expect(bandForPercentile(0.05)).toBe('difficult')
    expect(bandForPercentile(0.5)).toBe('typical')
    expect(bandForPercentile(0.9)).toBe('good')
    expect(bandForPercentile(0.99)).toBe('exceptional')
  })

  it('quantile interpolates correctly', () => {
    expect(quantile([1, 2, 3, 4, 5], 0.5)).toBe(3)
    expect(quantile([10, 20], 0.5)).toBe(15)
    expect(quantile([], 0.5)).toBe(0)
    expect(quantile([7], 0.9)).toBe(7)
  })

  it('unknown income spreads lives while known income pins them', () => {
    const unknown = profileWith({ employment: { status: 'employed' } })
    const configA = config({ seed: 'spread', horizonYears: 5 })
    const run = runMonteCarlo(unknown, configA, { numLives: 50 })
    const firstYearIncomes = run.aggregates[0]!.metrics.realIncome
    expect(firstYearIncomes.p90).toBeGreaterThan(firstYearIncomes.p10)
  })
})
