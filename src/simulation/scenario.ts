import type { PersonProfile } from '@/domain/person'
import { simulateLife } from './engine'
import { applyInterventions } from './apply'
import { deriveLifeSeed } from './rng'
import { buildAggregate, contributeLife, createBuffers, type MonteCarloAggregate } from './aggregate'
import type { SimulationConfig, SimulationResult } from './types'
import type { Intervention } from './interventions'

/**
 * Paired scenario comparison — the Decision Lab engine.
 *
 * Baseline and scenario lives share (baseSeed, lifeIndex): because the RNG is
 * split into per-domain streams, both branches see the SAME macro shocks and
 * investment returns unless the intervention logically changes exposure.
 * That makes counterfactual deltas meaningful: "the same life, except…".
 */

export interface PairedLifeOutcome {
  realNetWorthBase: number
  realNetWorthScenario: number
  compositeBase: number
  compositeScenario: number
}

export interface ScenarioComparisonOptions {
  numLives: number
  batchSize?: number
  onProgress?: (completed: number, total: number) => void
  signal?: { aborted: boolean }
}

export interface ScenarioComparison {
  baseline: MonteCarloAggregate & { config: SimulationConfig; elapsedMs: number }
  scenario: MonteCarloAggregate & { config: SimulationConfig; elapsedMs: number }
  paired: PairedLifeOutcome[]
  cancelled: boolean
  elapsedMs: number
}

export const runScenarioComparison = (
  profile: PersonProfile,
  config: SimulationConfig,
  interventions: Intervention[],
  options: ScenarioComparisonOptions,
): ScenarioComparison => {
  const started = Date.now()
  const numLives = Math.max(1, Math.min(options.numLives, 50_000))
  const batchSize = Math.max(1, options.batchSize ?? 200)

  const startAge = profile.demographics.age?.kind === 'known' ? profile.demographics.age.value : 40
  const years = Math.max(1, Math.min(config.horizonYears, 100 - startAge))
  const baseBuffers = createBuffers(years)
  const scenarioBuffers = createBuffers(years)
  const paired: PairedLifeOutcome[] = []

  let completed = 0
  let cancelled = false

  for (let lifeIndex = 0; lifeIndex < numLives; lifeIndex += batchSize) {
    if (options.signal?.aborted) {
      cancelled = true
      break
    }
    const batchEnd = Math.min(numLives, lifeIndex + batchSize)
    for (let i = lifeIndex; i < batchEnd; i++) {
      const lifeSeed = deriveLifeSeed(config.seed, i)
      const baseline = simulateLife(profile, config, lifeSeed)
      const scenarioResult = runScenarioLife(profile, config, lifeSeed, interventions)
      contributeLife(baseBuffers, baseline)
      contributeLife(scenarioBuffers, scenarioResult)
      const baseLast = baseline.snapshots[baseline.snapshots.length - 1]
      const scenLast = scenarioResult.snapshots[scenarioResult.snapshots.length - 1]
      paired.push({
        realNetWorthBase: baseLast?.realNetWorth ?? 0,
        realNetWorthScenario: scenLast?.realNetWorth ?? 0,
        compositeBase: baseline.final.composite,
        compositeScenario: scenarioResult.final.composite,
      })
      completed += 1
    }
    options.onProgress?.(completed, numLives)
  }

  const baseline = {
    ...buildAggregate({ buffers: baseBuffers, profile, config, cancelled }),
    config,
    elapsedMs: Date.now() - started,
  }
  const scenario = {
    ...buildAggregate({ buffers: scenarioBuffers, profile, config, cancelled }),
    config,
    elapsedMs: Date.now() - started,
  }

  return { baseline, scenario, paired, cancelled, elapsedMs: Date.now() - started }
}

export interface BranchDef {
  name: string
  interventions: Intervention[]
}

export interface BranchAggregate {
  name: string
  aggregate: MonteCarloAggregate & { config: SimulationConfig; elapsedMs: number }
  paired: PairedLifeOutcome[]
}

/**
 * Multi-branch comparison — e.g. Stay vs Germany vs Canada vs UAE.
 * Every branch shares the same (seed, lifeIndex) stream: identical worlds,
 * different decisions.
 */
export const runMultiBranchComparison = (
  profile: PersonProfile,
  config: SimulationConfig,
  branches: BranchDef[],
  options: ScenarioComparisonOptions,
): { baseline: ScenarioComparison['baseline']; branches: BranchAggregate[]; cancelled: boolean; elapsedMs: number } => {
  const started = Date.now()
  const numLives = Math.max(1, Math.min(options.numLives, 50_000))
  const batchSize = Math.max(1, options.batchSize ?? 200)

  const startAge = profile.demographics.age?.kind === 'known' ? profile.demographics.age.value : 40
  const years = Math.max(1, Math.min(config.horizonYears, 100 - startAge))
  const baseBuffers = createBuffers(years)
  const branchBuffers = branches.map(() => createBuffers(years))
  const branchPairs: PairedLifeOutcome[][] = branches.map(() => [])

  let completed = 0
  let cancelled = false

  for (let lifeIndex = 0; lifeIndex < numLives; lifeIndex += batchSize) {
    if (options.signal?.aborted) {
      cancelled = true
      break
    }
    const batchEnd = Math.min(numLives, lifeIndex + batchSize)
    for (let i = lifeIndex; i < batchEnd; i++) {
      const lifeSeed = deriveLifeSeed(config.seed, i)
      const baseline = simulateLife(profile, config, lifeSeed)
      contributeLife(baseBuffers, baseline)
      branches.forEach((branch, branchIndex) => {
        const scenarioLife = runScenarioLife(profile, config, lifeSeed, branch.interventions)
        contributeLife(branchBuffers[branchIndex]!, scenarioLife)
        const baseLast = baseline.snapshots[baseline.snapshots.length - 1]
        const scenLast = scenarioLife.snapshots[scenarioLife.snapshots.length - 1]
        branchPairs[branchIndex]!.push({
          realNetWorthBase: baseLast?.realNetWorth ?? 0,
          realNetWorthScenario: scenLast?.realNetWorth ?? 0,
          compositeBase: baseline.final.composite,
          compositeScenario: scenarioLife.final.composite,
        })
      })
      completed += 1
    }
    options.onProgress?.(completed, numLives)
  }

  const baseline = {
    ...buildAggregate({ buffers: baseBuffers, profile, config, cancelled }),
    config,
    elapsedMs: Date.now() - started,
  }
  const branchAggregates: BranchAggregate[] = branches.map((branch, index) => ({
    name: branch.name,
    aggregate: {
      ...buildAggregate({ buffers: branchBuffers[index]!, profile, config, cancelled }),
      config,
      elapsedMs: Date.now() - started,
    },
    paired: branchPairs[index]!,
  }))

  return { baseline, branches: branchAggregates, cancelled, elapsedMs: Date.now() - started }
}

/**
 * Run ONE scenario life. Same lifeSeed as the baseline twin on purpose:
 * per-domain RNG streams keep macro shocks and investment returns aligned
 * across branches (common random numbers) so deltas mean "same life, except…".
 */
export const runScenarioLife = (
  profile: PersonProfile,
  config: SimulationConfig,
  lifeSeed: number,
  interventions: Intervention[],
): SimulationResult =>
  simulateLife(profile, config, lifeSeed, (state) => applyInterventions(state, interventions))
