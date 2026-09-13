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

export const SIMULATION_ENGINE_VERSION = '0.6.0-decision-lab'

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
export { deriveLifeDrivers, derivePressures, type LifeDriver, type LifePressures } from './insights'
export { drawMacroYear, type MacroYear } from './world'
export {
  OCCUPATION_MODELS,
  assessSwitch,
  switchIncomeEffect,
  type OccupationModel,
  type SwitchAssessment,
  type SwitchDifficulty,
} from './careers'
export { applyInterventions } from './apply'
export {
  describeIntervention,
  DEFAULT_BRANCH_NAME,
  type Intervention,
  type InterventionSummary,
} from './interventions'
export {
  runScenarioComparison,
  runScenarioLife,
  runMultiBranchComparison,
  type ScenarioComparison,
  type PairedLifeOutcome,
  type ScenarioComparisonOptions,
  type BranchDef,
  type BranchAggregate,
} from './scenario'
export {
  recommendDestinations,
  migrationPreview,
  DEFAULT_PRIORITIES,
  type DestinationPriorities,
  type DestinationCard,
  type FeasibilityPreview,
} from './destinations'
export {
  assessMigrationFeasibility,
  applyMigration,
  purchasingPowerFactor,
  type FeasibilityAssessment,
} from './migrations'
export { compareRuns, type ScenarioComparisonAnalysis, type ScenarioDelta, type BreakEvenSummary } from './comparison'
export { recommendCareers, type CareerRecommendation, type RecommendationTier } from './recommendations'
