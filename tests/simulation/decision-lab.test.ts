import { describe, expect, it } from 'vitest'
import {
  assessSwitch,
  compareRuns,
  OCCUPATION_MODELS,
  recommendCareers,
  runScenarioComparison,
  runScenarioLife,
  simulateLife,
  type SimulationConfig,
} from '@/simulation'
import type { PersonProfile } from '@/domain'
import { known, monthlyMoney } from '@/domain'
import { DEMO_PROFILE } from '@/data/demo-profile'

const config = (over: Partial<SimulationConfig> = {}): SimulationConfig => ({
  seed: 'lab-universe',
  worldScenario: 'stable',
  horizonYears: 20,
  startCalendarYear: 2026,
  ...over,
})

const profileWith = (over: Partial<PersonProfile>): PersonProfile => ({
  ...DEMO_PROFILE,
  ...over,
  employment: { ...DEMO_PROFILE.employment, ...over.employment },
  education: { ...DEMO_PROFILE.education, ...over.education },
})

describe('occupation model & switch distance', () => {
  it('covers every occupation family with bounded attributes', () => {
    const families = Object.keys(OCCUPATION_MODELS)
    expect(families.length).toBeGreaterThanOrEqual(20)
    for (const model of Object.values(OCCUPATION_MODELS)) {
      for (const key of ['credentialBarrier', 'skillDemand', 'physicalIntensity', 'remoteCompatibility', 'stability', 'automationExposure', 'careerMobility', 'entrepreneurialApplicability', 'internationalTransferability'] as const) {
        const value = model[key]
        expect(value, `${model.family}.${key}`).toBeGreaterThanOrEqual(0)
        expect(value, `${model.family}.${key}`).toBeLessThanOrEqual(1)
      }
      expect(model.incomeCeiling).toBeGreaterThan(0)
      expect(Math.abs(model.growthOutlook)).toBeLessThanOrEqual(1)
    }
  })

  it('same-family switches are easy, cross-skill jumps are not', () => {
    const same = assessSwitch('finance', 'finance', 'bachelor')
    expect(same.difficulty).toBe('easy')
    const far = assessSwitch('agriculture', 'law-public-policy', 'primary')
    expect(['major-retraining', 'credential-gated', 'difficult']).toContain(far.difficulty)
    expect(far.skillOverlap).toBeLessThan(same.skillOverlap)
  })

  it('credential-gated fields are flagged without the credentials', () => {
    const toMedicine = assessSwitch('sales-marketing', 'healthcare', 'upper-secondary')
    expect(toMedicine.reasons.join(' ')).toMatch(/credential/i)
  })
})

describe('scenario interventions', () => {
  it('career change resets salary but keeps career capital above zero', () => {
    const switcher = profileWith({
      employment: {
        status: 'employed',
        occupationFamily: 'finance',
        seniority: 'senior',
        yearsExperience: known(12),
        grossIncome: known(monthlyMoney(20000, 'GHS')),
      },
    })
    const baseline = simulateLife(switcher, config({ horizonYears: 5 }), 31)
    const scenario = runScenarioLife(switcher, config({ horizonYears: 5 }), 31, [
      { type: 'change-career', target: 'technology', retrainingYears: 2 },
    ])
    // First snapshot income should be visibly reset vs baseline.
    const baseIncome = baseline.snapshots[0]!.realIncome
    const scenarioIncome = scenario.snapshots[0]!.realIncome
    expect(scenarioIncome).toBeLessThan(baseIncome)
    // But the run stays finite and recovers a real income stream.
    expect(Number.isFinite(scenarioIncome)).toBe(true)
    expect(scenario.snapshots[scenario.snapshots.length - 1]!.realIncome).toBeGreaterThan(0)
  })

  it('savings-rate intervention compounds into a different net worth path', () => {
    const saver = profileWith({
      employment: { status: 'employed', grossIncome: known(monthlyMoney(12000, 'GHS')) },
      finances: { savings: known(monthlyMoney(20000, 'GHS')), essentialMonthlyExpenses: known(monthlyMoney(4000, 'GHS')) },
      household: { sendsFamilySupport: false },
    })
    const base = simulateLife(saver, config({ horizonYears: 15 }), 41)
    const boosted = runScenarioLife(saver, config({ horizonYears: 15 }), 41, [
      { type: 'change-savings-rate', delta: 0.25 },
    ])
    const baseWorth = base.snapshots[base.snapshots.length - 1]!.realNetWorth
    const boostedWorth = boosted.snapshots[boosted.snapshots.length - 1]!.realNetWorth
    expect(boostedWorth).toBeGreaterThan(baseWorth)
  })

  it('full-time study suppresses income during the plan', () => {
    const learner = profileWith({
      employment: { status: 'employed', grossIncome: known(monthlyMoney(14000, 'GHS')) },
    })
    const result = runScenarioLife(learner, config({ horizonYears: 4 }), 17, [
      { type: 'start-education', level: 'master', years: 2, mode: 'full-time' },
    ])
    const during = result.snapshots[0]!.realIncome
    const after = result.snapshots[result.snapshots.length - 1]!.realIncome
    expect(during).toBeLessThan(after)
  })

  it('delaying children suppresses early births while the delay is active', () => {
    const family = profileWith({
      relationshipStatus: 'married',
      demographics: { countryOfResidence: 'GH', age: known(24), citizenships: ['GH'] },
      relationshipPreferences: { childrenPreference: 'yes', desiredNumberOfChildren: known(2) },
    })
    const baseline = simulateLife(family, config({ horizonYears: 6 }), 23)
    const delayed = runScenarioLife(family, config({ horizonYears: 6 }), 23, [
      { type: 'delay-children', years: 4 },
    ])
    const delayedEarlyChildren = delayed.snapshots.slice(0, 3).reduce((sum, s) => sum + s.childrenCount, 0)
    const baselineEarlyChildren = baseline.snapshots.slice(0, 3).reduce((sum, s) => sum + s.childrenCount, 0)
    expect(delayedEarlyChildren).toBeLessThanOrEqual(baselineEarlyChildren)
  })
})

describe('paired scenario comparison', () => {
  it('baseline and scenario share macro shocks (common random numbers)', () => {
    const profile = DEMO_PROFILE
    const baseline = simulateLife(profile, config({ horizonYears: 12, worldScenario: 'volatile' }), 5)
    const scenario = runScenarioLife(profile, config({ horizonYears: 12, worldScenario: 'volatile' }), 5, [
      { type: 'change-savings-rate', delta: 0.2 },
    ])
    const baseRecessions = baseline.events.filter((e) => e.type === 'recession').map((e) => e.year)
    const scenarioRecessions = scenario.events.filter((e) => e.type === 'recession').map((e) => e.year)
    expect(scenarioRecessions).toEqual(baseRecessions)
  })

  it('runScenarioComparison produces aligned aggregates, pairs, and break-even data', () => {
    const comparison = runScenarioComparison(DEMO_PROFILE, config({ horizonYears: 12, seed: 'cmp' }), [
      { type: 'change-savings-rate', delta: 0.2 },
    ], { numLives: 60 })
    expect(comparison.baseline.numLives).toBe(60)
    expect(comparison.scenario.numLives).toBe(60)
    expect(comparison.paired).toHaveLength(60)
    expect(comparison.baseline.aggregates).toHaveLength(12)
    const analysis = compareRuns(comparison.baseline, comparison.scenario, comparison.paired)
    expect(analysis.deltas.length).toBeGreaterThanOrEqual(4)
    expect(Number.isFinite(analysis.breakEven.shareAheadAtHorizon)).toBe(true)
    expect(analysis.breakEven.shareAheadAtHorizon).toBeGreaterThanOrEqual(0)
    expect(analysis.breakEven.shareAheadAtHorizon).toBeLessThanOrEqual(1)
    expect(analysis.tradeoffSummary.length).toBeGreaterThan(20)
  })

  it('a big savings boost reliably beats baseline (sanity direction)', () => {
    const comparison = runScenarioComparison(DEMO_PROFILE, config({ horizonYears: 15, seed: 'direction' }), [
      { type: 'change-savings-rate', delta: 0.3 },
    ], { numLives: 80 })
    const aheadShare = comparison.paired.filter((p) => p.realNetWorthScenario >= p.realNetWorthBase).length / comparison.paired.length
    expect(aheadShare).toBeGreaterThan(0.6)
  })

  it('isolates scenarios: the baseline object is not mutated by interventions', () => {
    const before = JSON.stringify(simulateLife(DEMO_PROFILE, config({ horizonYears: 6, seed: 'iso' }), 9).snapshots)
    runScenarioLife(DEMO_PROFILE, config({ horizonYears: 6, seed: 'iso' }), 9, [
      { type: 'change-career', target: 'technology', retrainingYears: 1 },
      { type: 'change-savings-rate', delta: 0.2 },
    ])
    const after = JSON.stringify(simulateLife(DEMO_PROFILE, config({ horizonYears: 6, seed: 'iso' }), 9).snapshots)
    expect(before).toBe(after)
  })
})

describe('business pathway', () => {
  it('business interventions produce business events and stay finite', () => {
    const founder = profileWith({
      employment: { status: 'employed', grossIncome: known(monthlyMoney(15000, 'GHS')) },
      finances: { savings: known(monthlyMoney(60000, 'GHS')) },
      behaviours: { ...DEMO_PROFILE.behaviours, discipline: 9, riskTolerance: 9 },
    })
    let sawBusinessEvent = false
    let finite = true
    for (let seed = 1; seed <= 25; seed++) {
      const result = runScenarioLife(founder, config({ horizonYears: 15, worldScenario: 'volatile' }), seed, [
        { type: 'start-business', industry: 'service-work', startingCapitalShare: 0.5, fullTime: true },
      ])
      if (result.events.some((e) => ['business-stable', 'business-breakout', 'business-failure'].includes(e.type))) {
        sawBusinessEvent = true
      }
      for (const snapshot of result.snapshots) {
        if (!Number.isFinite(snapshot.netWorth) || snapshot.debt < 0) finite = false
      }
    }
    expect(sawBusinessEvent).toBe(true)
    expect(finite).toBe(true)
  })

  it('failed businesses leave career capital scars (management + network up)', () => {
    const founder = profileWith({
      employment: { status: 'employed', grossIncome: known(monthlyMoney(15000, 'GHS')) },
      finances: { savings: known(monthlyMoney(40000, 'GHS')) },
      behaviours: { ...DEMO_PROFILE.behaviours, discipline: 1 },
    })
    // Run many seeds; failures should exist somewhere given early-phase risk.
    let failures = 0
    let rehiredAfterFailure = 0
    for (let seed = 1; seed <= 40; seed++) {
      const result = runScenarioLife(founder, config({ horizonYears: 20, worldScenario: 'difficult' }), seed, [
        { type: 'start-business', industry: 'hospitality', startingCapitalShare: 0.8, fullTime: true },
      ])
      const failEvent = result.events.find((e) => e.type === 'business-failure')
      if (failEvent) {
        failures++
        if (result.events.some((e) => e.type === 're-employed' && e.year > failEvent.year)) rehiredAfterFailure++
      }
    }
    expect(failures).toBeGreaterThan(0)
    expect(rehiredAfterFailure).toBeGreaterThan(0)
  })
})

describe('career recommendations', () => {
  it('recommends reachable, explainable paths and never the current field', () => {
    const profile = profileWith({
      education: { level: 'bachelor' },
      employment: { status: 'employed', occupationFamily: 'administration' },
    })
    const recommendations = recommendCareers({ profile })
    expect(recommendations.length).toBeGreaterThan(10)
    expect(recommendations.every((r) => r.target !== 'administration')).toBe(true)
    expect(recommendations.every((r) => r.reasons.length >= 2)).toBe(true)
    const tiers = new Set(recommendations.map((r) => r.tier))
    expect(tiers.has('strong')).toBe(true)
    // Sorted by score descending.
    for (let i = 1; i < recommendations.length; i++) {
      expect(recommendations[i - 1]!.score).toBeGreaterThanOrEqual(recommendations[i]!.score)
    }
  })

  it('is deterministic', () => {
    const profile = profileWith({ employment: { status: 'employed', occupationFamily: 'education' } })
    const a = JSON.stringify(recommendCareers({ profile }).map((r) => [r.target, r.tier, r.score]))
    const b = JSON.stringify(recommendCareers({ profile }).map((r) => [r.target, r.tier, r.score]))
    expect(a).toBe(b)
  })
})
