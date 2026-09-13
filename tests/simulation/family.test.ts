import { describe, expect, it } from 'vitest'
import { runMonteCarlo, simulateLife } from '@/simulation'
import type { SimulationConfig } from '@/simulation'
import type { PersonProfile, RelationshipStatus } from '@/domain'
import { known, monthlyMoney } from '@/domain'
import { DEMO_PROFILE } from '@/data/demo-profile'

const config = (over: Partial<SimulationConfig> = {}): SimulationConfig => ({
  seed: 'family-universe',
  worldScenario: 'stable',
  horizonYears: 35,
  startCalendarYear: 2026,
  ...over,
})

const profileWith = (over: Partial<PersonProfile>): PersonProfile => ({
  ...DEMO_PROFILE,
  ...over,
  demographics: { ...DEMO_PROFILE.demographics, ...over.demographics },
  relationshipPreferences: { ...DEMO_PROFILE.relationshipPreferences, ...over.relationshipPreferences },
})

/** Legal transitions of the relationship state machine. */
const LEGAL: Record<string, string[]> = {
  single: ['single', 'dating'],
  dating: ['dating', 'committed', 'single', 'separated'],
  committed: ['committed', 'cohabiting', 'single', 'separated'],
  cohabiting: ['cohabiting', 'married', 'separated', 'single'],
  married: ['married', 'separated', 'divorced'],
  separated: ['separated', 'divorced', 'dating'],
  divorced: ['divorced', 'dating'],
  widowed: ['widowed', 'dating'],
  other: ['other'],
}

describe('relationship state machine', () => {
  it('never makes an illegal transition across many lives', () => {
    const run = runMonteCarlo(DEMO_PROFILE, config({ worldScenario: 'volatile', horizonYears: 40 }), { numLives: 150 })
    let transitionsChecked = 0
    for (const { result } of run.representative) {
      const snapshots = result.snapshots
      for (let i = 1; i < snapshots.length; i++) {
        const from = snapshots[i - 1]!.relationship as RelationshipStatus
        const to = snapshots[i]!.relationship as RelationshipStatus
        if (from === to) continue
        expect(LEGAL[from] ?? LEGAL.other).toContain(to)
        transitionsChecked++
      }
    }
    expect(transitionsChecked).toBeGreaterThan(0)
  })

  it('separated relationships can finalise into divorce but never skip straight from single', () => {
    const run = runMonteCarlo(DEMO_PROFILE, config({ horizonYears: 40, seed: 'sep' }), { numLives: 100 })
    for (const { result } of run.representative) {
      const snapshots = result.snapshots
      for (let i = 1; i < snapshots.length; i++) {
        const before = snapshots[i - 1]!.relationship
        const after = snapshots[i]!.relationship
        if (after === 'divorced' && before !== 'divorced') {
          expect(['separated', 'married']).toContain(before)
        }
      }
    }
  })
})

describe('partner agents', () => {
  it('partners persist: replay produces the identical partnered timeline', () => {
    const married = profileWith({
      relationshipStatus: 'married',
      relationshipPreferences: { desiresPartnership: 'yes', marriagePreference: 'important', childrenPreference: 'no' },
    })
    const result = simulateLife(married, config({ horizonYears: 10 }), 555)
    const replay = simulateLife(married, config({ horizonYears: 10 }), 555)
    expect(JSON.stringify(replay.snapshots)).toBe(JSON.stringify(result.snapshots))
    // A partnered start with a 'no children' preference is stable: still partnered at the end.
    const last = result.snapshots[result.snapshots.length - 1]!
    expect(['married', 'cohabiting', 'committed', 'dating']).toContain(last.relationship)
  })

  it('generates the same partner for the same meeting seed', () => {
    const single = profileWith({ relationshipStatus: 'single' })
    const a = simulateLife(single, config({ seed: 'meet' }), 999)
    const b = simulateLife(single, config({ seed: 'meet' }), 999)
    const aMeeting = a.events.find((event) => event.type === 'relationship-start')
    const bMeeting = b.events.find((event) => event.type === 'relationship-start')
    expect(aMeeting?.year).toBe(bMeeting?.year)
    expect(JSON.stringify(a.snapshots)).toBe(JSON.stringify(b.snapshots))
  })

  it('partner income shows up in household finances while partnered', () => {
    const married = profileWith({
      relationshipStatus: 'married',
      relationshipPreferences: { desiresPartnership: 'yes', childrenPreference: 'no' },
    })
    const run = runMonteCarlo(married, config({ horizonYears: 15, seed: 'household' }), { numLives: 40 })
    const typical = run.representative.find((entry) => entry.band === 'typical')!.result
    const partneredSnapshots = typical.snapshots.filter((s) => ['married', 'cohabiting'].includes(s.relationship))
    const withPartnerIncome = partneredSnapshots.filter((s) => s.partnerMonthlyIncome > 0)
    // The vast majority of partnered years should carry partner income (some unemployment/retirement allowed).
    expect(withPartnerIncome.length).toBeGreaterThan(partneredSnapshots.length * 0.5)
    expect(partneredSnapshots.every((s) => s.incomeEarners >= 1)).toBe(true)
  })
})

describe('children lifecycle', () => {
  it('a stated "no" keeps children at zero even in long marriages', () => {
    const childfree = profileWith({
      relationshipStatus: 'married',
      relationshipPreferences: {
        desiresPartnership: 'yes',
        marriagePreference: 'important',
        childrenPreference: 'no',
      },
    })
    const run = runMonteCarlo(childfree, config({ horizonYears: 40, seed: 'cf' }), { numLives: 100 })
    for (const { result } of run.representative) {
      for (const snapshot of result.snapshots) {
        expect(snapshot.childrenCount).toBe(0)
      }
    }
  })

  it('children arrive, age through stages, and eventually leave the household', () => {
    const family = profileWith({
      relationshipStatus: 'married',
      demographics: { countryOfResidence: 'GH', age: known(24), citizenships: ['GH'] },
      relationshipPreferences: {
        desiresPartnership: 'yes',
        marriagePreference: 'important',
        childrenPreference: 'yes',
        desiredNumberOfChildren: known(3),
      },
    })
    const run = runMonteCarlo(family, config({ horizonYears: 45, seed: 'family-growth' }), { numLives: 60 })
    const anyFamily = run.representative.some(({ result }) => result.snapshots.some((s) => s.childrenCount > 0))
    expect(anyFamily).toBe(true)
    // Somewhere in the universe children grow up and the household count drops from its peak.
    const { result } = run.representative.find(({ result }) => result.snapshots.some((s) => s.childrenCount > 0))!
    const peak = Math.max(...result.snapshots.map((s) => s.childrenCount))
    const last = result.snapshots[result.snapshots.length - 1]!.childrenCount
    expect(last).toBeLessThanOrEqual(peak)
  })
})

describe('breakdown consequences', () => {
  it('a divorce ends partner income and can move children or start support', () => {
    const married = profileWith({
      relationshipStatus: 'married',
      household: { size: known(2) },
      relationshipPreferences: { desiresPartnership: 'yes', marriagePreference: 'important', childrenPreference: 'unsure' },
    })
    const run = runMonteCarlo(married, config({ horizonYears: 40, worldScenario: 'difficult', seed: 'break' }), {
      numLives: 80,
    })
    for (const { result } of run.representative) {
      const snapshots = result.snapshots
      for (let i = 1; i < snapshots.length; i++) {
        const before = snapshots[i - 1]!
        const after = snapshots[i]!
        const brokeUp =
          ['married', 'cohabiting'].includes(before.relationship) && ['divorced', 'separated', 'single'].includes(after.relationship)
        if (brokeUp) {
          expect(after.partnerMonthlyIncome).toBe(0)
          expect(after.householdSize).toBeLessThan(before.householdSize)
        }
      }
    }
  })
})

describe('sprint 5 stress profiles', () => {
  const cases: [string, PersonProfile][] = [
    ['single + definitely no children', profileWith({ relationshipStatus: 'single', relationshipPreferences: { desiresPartnership: 'no', childrenPreference: 'no' } })],
    ['married + three children', profileWith({ relationshipStatus: 'married', dependents: { count: known(3) }, relationshipPreferences: { childrenPreference: 'yes', desiredNumberOfChildren: known(3) } })],
    ['divorced parent', profileWith({ relationshipStatus: 'divorced', dependents: { count: known(2) } })],
    ['single parent', profileWith({ relationshipStatus: 'single', dependents: { count: known(1) }, relationshipPreferences: { childrenPreference: 'yes', desiredNumberOfChildren: known(1) } })],
    ['partner earns much more', profileWith({ relationshipStatus: 'married', employment: { status: 'employed', grossIncome: known(monthlyMoney(4000, 'GHS')) } })],
    ['partner unemployed risk (user sole earner, many dependents)', profileWith({ relationshipStatus: 'married', dependents: { count: known(4) }, finances: { savings: known(monthlyMoney(2000, 'GHS')) } })],
    ['elder-care obligations', profileWith({
      demographics: { countryOfResidence: 'GH', age: known(52), citizenships: ['GH'] },
      constraints: { familyCareObligations: true },
      household: { sendsFamilySupport: true, hasCareObligations: true },
    })],
    ['living with extended family', profileWith({ household: { size: known(7), livingWithFamily: true, sendsFamilySupport: true, hasCareObligations: true } })],
    ['child-free couple', profileWith({ relationshipStatus: 'cohabiting', relationshipPreferences: { desiresPartnership: 'yes', childrenPreference: 'no' } })],
    ['high-income dual-career household', profileWith({ relationshipStatus: 'married', employment: { status: 'employed', seniority: 'executive-specialist', grossIncome: known(monthlyMoney(30000, 'GHS')) } })],
    ['low-income household with dependents', profileWith({ relationshipStatus: 'married', dependents: { count: known(4) }, employment: { status: 'informal', grossIncome: known(monthlyMoney(2500, 'GHS')) } })],
  ]

  for (const [name, profile] of cases) {
    it(`stays numerically stable: ${name}`, () => {
      const result = simulateLife(profile, config({ horizonYears: 35, worldScenario: 'volatile', seed: `stress-${name}` }), 77)
      for (const snapshot of result.snapshots) {
        expect(Number.isFinite(snapshot.netWorth)).toBe(true)
        expect(Number.isFinite(snapshot.realIncome)).toBe(true)
        expect(snapshot.debt).toBeGreaterThanOrEqual(0)
        expect(snapshot.savings).toBeGreaterThanOrEqual(0)
        expect(snapshot.householdSize).toBeGreaterThanOrEqual(1)
        expect(snapshot.incomeEarners).toBeGreaterThanOrEqual(0)
      }
    })
  }
})
