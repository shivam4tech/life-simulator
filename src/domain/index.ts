/**
 * Domain layer — framework-free types and pure helpers.
 *
 * Nothing here may import from app/, components/ or features/. The simulation
 * engine (Sprint 3) builds directly on these definitions and must stay usable
 * from Node tests and Web Workers without any DOM dependency.
 */

export * from './values'
export * from './taxonomies'
export * from './money'
export * from './country'
export * from './person'
export * from './validation'
