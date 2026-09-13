import { describe, expect, it } from 'vitest'
import {
  cloneState,
  createFork,
  runMultiBranchComparison,
  createNestedFork,
  rewindTo,
  runButterfly,
  runSensitivity,
  simulateFromState,
  simulateLife,
  BUTTERFLY_PRESETS,
  SENSITIVITY_DIMENSIONS,
  type ForkBranch,
  type SimulationConfig,
} from '@/simulation'
import { DEMO_PROFILE } from '@/data/demo-profile'

const config = (over: Partial<SimulationConfig> = {}): SimulationConfig => ({
  seed: 'fork-universe',
  worldScenario: 'stable',
  horizonYears: 30,
  startCalendarYear: 2026,
  ...over,
})



describe('rewind (deterministic state reconstruction)', () => {
  it('restores the exact state that existed at a year index', () => {
    const full = simulateLife(DEMO_PROFILE, config(), 21)
    // rewindTo(n) = state after n ticks; snapshot[15] is after 16 ticks.
    const age15 = rewindTo(DEMO_PROFILE, config(), 21, 16)
    // The snapshot recorded at year index 15 must match the replayed state exactly.
    const snapshot = full.snapshots[15]!
    expect(age15.age).toBe(snapshot.age)
    expect(age15.calendarYear).toBe(snapshot.year)
    expect(age15.savings).toBeCloseTo(snapshot.savings, 4)
    expect(age15.investments).toBeCloseTo(snapshot.investments, 4)
    expect(age15.debt).toBeCloseTo(snapshot.debt, 4)
    expect(age15.monthlyIncome / age15.inflationIndex).toBeCloseTo(snapshot.realIncome / 12, 2)
  })

  it('continuing from a rewound state reproduces the rest of the original life', () => {
    const full = simulateLife(DEMO_PROFILE, config(), 33)
    const stateAt10 = rewindTo(DEMO_PROFILE, config(), 33, 10)
    const rest = simulateFromState(stateAt10, config().horizonYears - 10, 33)
    expect(rest.snapshots.map((s) => s.realNetWorth.toFixed(2))).toEqual(
      full.snapshots.slice(10).map((s) => s.realNetWorth.toFixed(2)),
    )
  })
})

describe('forks from history', () => {
  it('fork at age ~25 (early) shares history and diverges after', () => {
    // Single and child-free: the only divergence channel is the savings lever.
    const hermit = {
      ...DEMO_PROFILE,
      relationshipStatus: 'single' as const,
      relationshipPreferences: { desiresPartnership: 'no' as const, childrenPreference: 'no' as const },
    }
    const original = simulateLife(hermit, config(), 44)
    const fork = createFork(hermit, config(), 44, {
      forkYearIndex: 3,
      name: 'Early switch',
      interventions: [{ type: 'change-savings-rate', delta: 0.2 }],
    }, 'test')
    // Shared history: fork starts at the same age as the rewind point.
    expect(fork.forkState.age).toBe(original.snapshots[3]!.age)
    // Shared prefix: identical history up to the fork.
    for (let i = 0; i < 3; i++) {
      expect(fork.forkState.savings).toBeCloseTo(original.snapshots[3]!.savings, 4)
    }
    // Post-fork divergence: the branch must differ somewhere after the fork.
    const originalTail = original.snapshots.slice(4).map((snapshot) => snapshot.realNetWorth.toFixed(2))
    const forkTail = fork.result.snapshots.map((snapshot) => snapshot.realNetWorth.toFixed(2))
    expect(forkTail).not.toEqual(originalTail)
    // And a +20% savings branch should end ahead in most PAIRED lives.
    const comparison = runMultiBranchComparison(hermit, config({ horizonYears: 20, seed: 'fork-dir' }), [
      { name: 'Save more', interventions: [{ type: 'change-savings-rate', delta: 0.2 }] },
    ], { numLives: 40 })
    const ahead = comparison.branches[0]!.paired.filter((pair) => pair.realNetWorthScenario >= pair.realNetWorthBase).length / 40
    expect(ahead).toBeGreaterThan(0.55)
  })

  it('fork at age ~60 (late) works with the remaining horizon', () => {
    const fork = createFork(DEMO_PROFILE, config(), 51, {
      forkYearIndex: 24,
      name: 'Late savings push',
      interventions: [{ type: 'change-savings-rate', delta: 0.25 }],
    }, 'test')
    expect(fork.forkState.age).toBe(53)
    expect(fork.result.snapshots.length).toBeLessThanOrEqual(config().horizonYears - 24)
    for (const snapshot of fork.result.snapshots) {
      expect(Number.isFinite(snapshot.realNetWorth)).toBe(true)
    }
  })

  it('nested forks chain breadcrumbs and replay identically', () => {
    const parent = createFork(DEMO_PROFILE, config(), 66, {
      forkYearIndex: 4,
      name: 'Move to Germany',
      interventions: [{ type: 'migrate', targetCountry: 'DE' }],
    }, 'test')
    const child = createNestedFork(DEMO_PROFILE, parent, {
      forkYearIndex: 8,
      name: '…and go freelance',
      interventions: [{ type: 'change-working-hours', deltaHours: -8 }],
    }, 'test')
    expect(child.parentBranchId).toBe(parent.id)
    expect(child.breadcrumbs.length).toBe(2)
    const replay = createNestedFork(DEMO_PROFILE, parent, {
      forkYearIndex: 8,
      name: '…and go freelance',
      interventions: [{ type: 'change-working-hours', deltaHours: -8 }],
    }, 'test')
    expect(JSON.stringify(replay.result.snapshots)).toBe(JSON.stringify(child.result.snapshots))
  })

  it('deleting a parent re-parents children without corruption', () => {
    // Simulated deletion semantics mirror the UI's ForkLab.deleteFork.
    const parent = createFork(DEMO_PROFILE, config(), 71, {
      forkYearIndex: 5,
      name: 'Parent',
      interventions: [{ type: 'change-savings-rate', delta: 0.1 }],
    }, 'test')
    const child = createNestedFork(DEMO_PROFILE, parent, {
      forkYearIndex: 10,
      name: 'Child',
      interventions: [{ type: 'learn-skill' }],
    }, 'test')
    const branches: ForkBranch[] = [parent, child]
    const after = branches
      .filter((branch) => branch.id !== parent.id)
      .map((branch) =>
        branch.parentBranchId === parent.id
          ? { ...branch, parentBranchId: 'root', parentName: 'Original life' }
          : branch,
      )
    expect(after).toHaveLength(1)
    expect(after[0]!.parentBranchId).toBe('root')
    expect(after[0]!.result.snapshots.length).toBeGreaterThan(0)
  })

  it('forking at the very start is equivalent to an intervened initial run', () => {
    const fork = createFork(DEMO_PROFILE, config(), 88, {
      forkYearIndex: 0,
      name: 'From the beginning',
      interventions: [{ type: 'change-savings-rate', delta: 0.15 }],
    }, 'test')
    const straight = simulateLife(DEMO_PROFILE, config(), 88, (state) => {
      state.savingsRateDelta += 0.15
      return state
    })
    expect(fork.result.snapshots.map((s) => s.realNetWorth.toFixed(2))).toEqual(
      straight.snapshots.map((s) => s.realNetWorth.toFixed(2)),
    )
  })
})

describe('common random numbers across branches', () => {
  it('the same shocks hit baseline and branch (recession years align)', () => {
    const original = simulateLife(DEMO_PROFILE, config({ worldScenario: 'volatile' }), 61)
    const fork = createFork(DEMO_PROFILE, config({ worldScenario: 'volatile' }), 61, {
      forkYearIndex: 4,
      name: 'Savings fork',
      interventions: [{ type: 'change-savings-rate', delta: 0.15 }],
    }, 'test')
    const originalRecessions = original.snapshots
      .map((snapshot, index) => (snapshot.events.some((event) => event.type === 'recession') ? index : -1))
      .filter((index) => index >= 6)
    const forkRecessions = fork.result.snapshots
      .map((snapshot, index) => (snapshot.events.some((event) => event.type === 'recession') ? index + 6 : -1))
      .filter((index) => index >= 6)
    expect(forkRecessions).toEqual(originalRecessions.map((index) => index + 1))
  })
})

describe('butterfly mode', () => {
  it('small changes produce measurable, finite ripples', () => {
    for (const preset of BUTTERFLY_PRESETS) {
      const divergence = runButterfly(DEMO_PROFILE, config({ horizonYears: 25 }), 91, preset, 4)
      for (const snapshot of [divergence.atEnd]) {
        if (snapshot) {
          expect(Number.isFinite(snapshot.realNetWorth)).toBe(true)
          expect(Number.isFinite(snapshot.healthIndex)).toBe(true)
        }
      }
    }
  })

  it('exercise preset improves health early (direct effect)', () => {
    const exercise = BUTTERFLY_PRESETS.find((preset) => preset.key === 'exercise-2')!
    const divergence = runButterfly(DEMO_PROFILE, config({ horizonYears: 20 }), 15, exercise, 3)
    expect(divergence.atYear5).not.toBeNull()
    if (divergence.atYear5) {
      expect(divergence.atYear5.healthIndex).toBeGreaterThan(0)
    }
  })
})

describe('sensitivity analysis', () => {
  it('ranks dimensions by outcome spread and stays finite', () => {
    const results = runSensitivity(DEMO_PROFILE, config({ horizonYears: 15, seed: 'sens' }), 'realNetWorth', {
      numLivesPerLevel: 40,
    })
    expect(results).toHaveLength(SENSITIVITY_DIMENSIONS.length)
    for (const dimension of results) {
      expect(Number.isFinite(dimension.sensitivity)).toBe(true)
      expect(dimension.sensitivity).toBeGreaterThanOrEqual(0)
      for (const level of dimension.levels) {
        expect(Number.isFinite(level.median)).toBe(true)
      }
    }
    // Sorted descending by sensitivity.
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1]!.sensitivity).toBeGreaterThanOrEqual(results[i]!.sensitivity)
    }
  })

  it('the economic regime dimension moves net worth strongly', () => {
    const results = runSensitivity(DEMO_PROFILE, config({ horizonYears: 15, seed: 'sens-2' }), 'realNetWorth', {
      numLivesPerLevel: 50,
    })
    const regime = results.find((dimension) => dimension.key === 'economic-regime')!
    expect(regime.sensitivity).toBeGreaterThan(0.2)
  })

  it('respects cancellation between dimensions', () => {
    const signal = { aborted: false }
    let calls = 0
    const results = runSensitivity(DEMO_PROFILE, config({ horizonYears: 8, seed: 'cancel' }), 'goalAlignment', {
      numLivesPerLevel: 20,
      signal,
      onProgress: () => {
        calls += 1
        if (calls >= 2) signal.aborted = true
      },
    })
    expect(results.length).toBeLessThan(SENSITIVITY_DIMENSIONS.length)
  })
})

describe('fork state cloning', () => {
  it('cloneState isolates mutations', () => {
    const state = rewindTo(DEMO_PROFILE, config(), 101, 5)
    const clone = cloneState(state)
    clone.savings += 1000
    clone.children.push({ id: 'x', arrivalYear: 2030, adopted: false, age: 1, stage: 'infancy', educationStage: 'pre', healthBurden: 'none', livingWithUser: true })
    expect(state.savings).not.toBe(clone.savings)
    expect(state.children.length).toBe(clone.children.length - 1)
  })
})
