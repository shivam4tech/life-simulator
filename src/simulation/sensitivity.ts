import type { PersonProfile } from '@/domain/person'
import { simulateLife } from './engine'
import { deriveLifeSeed } from './rng'
import { applyInterventions } from './apply'
import type { SimulationConfig } from './types'
import type { Intervention } from './interventions'

/**
 * Sensitivity analysis — "what matters most?" (Sprint 8).
 *
 * One input dimension is varied across discrete levels around the user's
 * starting state; each level runs its own small Monte Carlo; the spread of an
 * outcome's median across levels measures how sensitive that outcome is to
 * the dimension. The bars show MODEL sensitivity, not philosophical
 * importance. Everything is deterministic (per-level seeds derive from the
 * base seed and level index).
 */

export type SensitivityMetric = 'realNetWorth' | 'goalAlignment' | 'healthIndex' | 'runwayMonths'

export type SensitivityDimensionKey =
  | 'savings-rate'
  | 'working-hours'
  | 'career-ambition'
  | 'discipline'
  | 'health-behaviour'
  | 'children'
  | 'economic-regime'
  | 'urban-location'

export interface SensitivityLevel {
  label: string
  interventions: Intervention[]
  worldScenario?: SimulationConfig['worldScenario']
}

export interface SensitivityLevelResult {
  label: string
  /** Median of the requested outcome at the horizon. */
  median: number
  /** Share of lives at this level (finite set). */
  numLives: number
}

export interface SensitivityDimensionResult {
  key: SensitivityDimensionKey
  label: string
  metric: SensitivityMetric
  levels: SensitivityLevelResult[]
  /** 0–1 spread: (max − min) / max(|median of middle levels|, 1), clamped. */
  sensitivity: number
}

export interface SensitivityOptions {
  numLivesPerLevel: number
  onProgress?: (completedDimensions: number, totalDimensions: number) => void
  signal?: { aborted: boolean }
}

const interventionSets: Record<SensitivityDimensionKey, SensitivityLevel[]> = {
  'savings-rate': [
    { label: 'Save less', interventions: [{ type: 'change-savings-rate', delta: -0.12 }] },
    { label: 'As you are', interventions: [] },
    { label: 'Save +10%', interventions: [{ type: 'change-savings-rate', delta: 0.1 }] },
    { label: 'Save +22%', interventions: [{ type: 'change-savings-rate', delta: 0.22 }] },
  ],
  'working-hours': [
    { label: '−12 h/week', interventions: [{ type: 'change-working-hours', deltaHours: -12 }] },
    { label: 'As you are', interventions: [] },
    { label: '+10 h/week', interventions: [{ type: 'change-working-hours', deltaHours: 10 }] },
  ],
  discipline: [
    { label: 'As you are', interventions: [] },
    { label: 'More disciplined', interventions: [{ type: 'learn-skill' }, { type: 'change-savings-rate', delta: 0.08 }] },
  ],
  'health-behaviour': [
    { label: 'Less active', interventions: [{ type: 'lifestyle-change', activityDelta: -3, sleepDelta: -1 }] },
    { label: 'As you are', interventions: [] },
    { label: 'Much more active', interventions: [{ type: 'lifestyle-change', activityDelta: 3, sleepDelta: 1 }] },
  ],
  children: [
    { label: 'Child-free', interventions: [{ type: 'delay-children', years: 40 }] },
    { label: 'As you are', interventions: [] },
    { label: 'Try now', interventions: [{ type: 'have-child' }] },
  ],
  'economic-regime': [
    { label: 'Difficult world', interventions: [], worldScenario: 'difficult' as const },
    { label: 'Stable world', interventions: [], worldScenario: 'stable' as const },
    { label: 'Optimistic world', interventions: [], worldScenario: 'optimistic' as const },
  ],
  'career-ambition': [
    { label: 'Quiet ambition', interventions: [] },
    { label: 'As you are', interventions: [] },
    { label: 'Burning ambition', interventions: [] },
  ],
  'urban-location': [
    { label: 'Rural / small town', interventions: [{ type: 'relocate', settlement: 'small-town' }] },
    { label: 'As you are', interventions: [] },
    { label: 'Global city', interventions: [{ type: 'relocate', settlement: 'global-city' }] },
  ],
}

const DIMENSION_LABELS: Record<SensitivityDimensionKey, string> = {
  'savings-rate': 'Savings behaviour',
  'working-hours': 'Working hours',
  'career-ambition': 'Career ambition',
  discipline: 'Discipline & learning',
  'health-behaviour': 'Health behaviour',
  children: 'Family path',
  'economic-regime': 'Economic regime',
  'urban-location': 'Location',
}

/** Career-ambition levels are modelled via behaviour shifts (needs profile mutation). */
const applyAmbitionShift = (profile: PersonProfile, shift: number): PersonProfile => ({
  ...profile,
  behaviours: { ...profile.behaviours, careerAmbition: Math.max(0, Math.min(10, (profile.behaviours?.careerAmbition ?? 5) + shift)) },
})

export const SENSITIVITY_DIMENSIONS: readonly SensitivityDimensionKey[] = [
  'savings-rate',
  'economic-regime',
  'health-behaviour',
  'working-hours',
  'children',
  'urban-location',
  'discipline',
  'career-ambition',
]

/** Run the full sweep across all dimensions for one outcome metric. */
export const runSensitivity = (
  profile: PersonProfile,
  config: SimulationConfig,
  metric: SensitivityMetric,
  options: SensitivityOptions,
): SensitivityDimensionResult[] => {
  const results: SensitivityDimensionResult[] = []
  let completed = 0

  for (const key of SENSITIVITY_DIMENSIONS) {
    if (options.signal?.aborted) break
    const levels = interventionSets[key]!
    const levelResults: SensitivityLevelResult[] = []

    levels.forEach((level, levelIndex) => {
      let levelProfile = profile
      if (key === 'career-ambition') {
        // Ambition is a behaviour, not an intervention — shift the profile.
        const shift = levelIndex === 0 ? -3 : levelIndex === levels.length - 1 ? 3 : 0
        levelProfile = applyAmbitionShift(profile, shift)
      }
      const levelConfig: SimulationConfig = level.worldScenario
        ? { ...config, worldScenario: level.worldScenario }
        : config
      const samples: number[] = []
      const lives = Math.max(20, options.numLivesPerLevel)
      for (let i = 0; i < lives; i++) {
        const lifeSeed = deriveLifeSeed(config.seed, i)
        const result = simulateLife(levelProfile, levelConfig, lifeSeed, (state) =>
          applyInterventions(state, level.interventions),
        )
        const last = result.snapshots[result.snapshots.length - 1]
        if (last) samples.push(last[metric])
      }
      samples.sort((a, b) => a - b)
      const median = samples.length > 0 ? samples[Math.floor(samples.length / 2)]! : 0
      levelResults.push({ label: level.label, median, numLives: samples.length })
    })

    const medians = levelResults.map((level) => level.median)
    const max = Math.max(...medians)
    const min = Math.min(...medians)
    const middle = levelResults.length % 2 === 0
      ? Math.abs((medians[Math.floor(medians.length / 2) - 1] ?? 0) + (medians[Math.floor(medians.length / 2)] ?? 0)) / 2 || 1
      : Math.abs(medians[Math.floor(medians.length / 2)] ?? 1) || 1
    const sensitivity = Math.min(1, Math.abs(max - min) / Math.max(Math.abs(middle), 1))

    results.push({
      key,
      label: DIMENSION_LABELS[key],
      metric,
      levels: levelResults,
      sensitivity: Number.isFinite(sensitivity) ? sensitivity : 0,
    })
    completed += 1
    options.onProgress?.(completed, SENSITIVITY_DIMENSIONS.length)
  }

  return results.sort((a, b) => b.sensitivity - a.sensitivity)
}

