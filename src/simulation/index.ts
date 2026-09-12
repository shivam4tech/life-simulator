/**
 * Simulation layer — the deterministic life simulation engine (Sprint 3).
 *
 * Boundary rules:
 *  - framework-free: no React/DOM imports; runs in Web Workers and Node tests;
 *  - all randomness flows through ./rng (seeded, per-domain sub-streams);
 *  - same engine version + profile + config + seed ⇒ byte-identical futures;
 *  - every coefficient lives in ./assumptions (placeholder-labelled registry).
 *
 * Public API:
 *  - simulateLife / runSingleLife — one full deterministic life
 *  - runMonteCarlo                — batched many-life runner (progress/cancel)
 *  - runSimulationAsync           — worker-backed client for the UI
 *  - aggregate helpers            — percentiles, bands, representative seeds
 */

export const SIMULATION_ENGINE_VERSION = '0.3.0-deterministic-core'

export * from './types'
export * from './rng'
export * from './assumptions'
export { initialiseLife, ProfileNotSimulatableError } from './init'
export { simulateLife, tickYear, computeFinalOutcome, computeGoalAlignment, dimensionScores, AGE_LIMIT } from './engine'
export { runMonteCarlo, runSingleLife, type MonteCarloRun, type RunOptions } from './runner'
export {
  buildAggregate,
  contributeLife,
  createBuffers,
  quantile,
  percentilesOf,
  bandForPercentile,
  type MonteCarloAggregate,
  type YearAggregate,
  type BandSummary,
  type RepresentativeSummary,
  type Percentiles,
  type AggregateMetricKey,
} from './aggregate'
export { runSimulationAsync, type SimulationRunHandle, type Outcome } from './client'
export { drawMacroYear, type MacroYear } from './world'
