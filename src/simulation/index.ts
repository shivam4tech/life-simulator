/**
 * Simulation layer — reserved for the deterministic life simulation engine
 * (Sprint 3: seeded RNG, LifeState, tick stages, Monte Carlo runner).
 *
 * Boundary rule: this layer is framework-free. It must never import from
 * app/, components/ or features/ so it can run in Web Workers and Node tests.
 */

export const SIMULATION_ENGINE_VERSION = '0.1.0-foundation'
