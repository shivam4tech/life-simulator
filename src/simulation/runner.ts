import type { PersonProfile } from '@/domain/person'
import { simulateLife } from './engine'
import { deriveLifeSeed } from './rng'
import { buildAggregate, contributeLife, createBuffers, type MonteCarloAggregate } from './aggregate'
import type { SimulationConfig, SimulationResult } from './types'

/**
 * Monte Carlo runner.
 *
 * Pure, framework-free, and chunked: lives run in batches so callers can
 * receive progress and cancel between batches. The engine never touches the
 * DOM, so this function runs identically on the main thread, in a Web Worker,
 * or in Node tests.
 */

export interface RunOptions {
  numLives: number
  batchSize?: number
  onProgress?: (completed: number, total: number) => void
  signal?: { aborted: boolean }
}

export interface MonteCarloRun extends MonteCarloAggregate {
  elapsedMs: number
  config: SimulationConfig
}

export const runMonteCarlo = (
  profile: PersonProfile,
  config: SimulationConfig,
  options: RunOptions,
): MonteCarloRun => {
  const started = Date.now()
  const numLives = Math.max(1, Math.min(options.numLives, 100_000))
  const batchSize = Math.max(1, options.batchSize ?? 250)

  // Years upper bound: horizon, but lives may stop at the engine age limit.
  const startAge = profile.demographics.age?.kind === 'known' ? profile.demographics.age.value : 40
  const years = Math.max(1, Math.min(config.horizonYears, 100 - startAge))
  const buffers = createBuffers(years)

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
      const result: SimulationResult = simulateLife(profile, config, lifeSeed)
      contributeLife(buffers, result)
      completed += 1
    }
    options.onProgress?.(completed, numLives)
  }

  const aggregate = buildAggregate({ buffers, profile, config, cancelled })
  return { ...aggregate, elapsedMs: Date.now() - started, config }
}

/** Run a single life — story mode / seed replay (full timeline). */
export const runSingleLife = (
  profile: PersonProfile,
  config: SimulationConfig,
  lifeIndexOrSeed?: number,
): SimulationResult => {
  const lifeSeed =
    lifeIndexOrSeed !== undefined ? deriveLifeSeed(config.seed, lifeIndexOrSeed) : deriveLifeSeed(config.seed, 0)
  return simulateLife(profile, config, lifeSeed)
}
