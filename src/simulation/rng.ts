/**
 * Deterministic randomness — the foundation of reproducible futures.
 *
 * Strategy:
 *   1. Every simulation run has a base seed (string or number).
 *   2. Each simulated life derives its own seed: hash(baseSeed, lifeIndex).
 *   3. Every (year, domain) pair derives an independent sub-stream:
 *      hash(lifeSeed, year, domain). Adding a new draw inside one domain
 *      therefore never scrambles unrelated domains' histories.
 *   4. All engine randomness MUST come from `rngFor` — uncontrolled
 *      Math.random() is forbidden in simulation code.
 *
 * PRNG: mulberry32 (small, fast, well-distributed, fully deterministic).
 * Hashing: xmur3-style finaliser for string seeds + integer mix for streams.
 */

export type Rng = () => number

/** xmur3 string hash → 32-bit seed generator. */
export const hashString = (str: string): number => {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

/** Integer finaliser (splitmix64-inspired 32-bit mix). */
const mix32 = (n: number): number => {
  let z = n | 0
  z = Math.imul(z ^ (z >>> 16), 0x7feb352d)
  z = Math.imul(z ^ (z >>> 15), 0x846ca68b)
  z ^= z >>> 16
  return z >>> 0
}

export const hashCombine = (...parts: number[]): number => {
  let h = 0x9e3779b9
  for (const part of parts) h = mix32(h ^ mix32(part | 0))
  return h
}

/** mulberry32 PRNG factory. Returns uniform floats in [0, 1). */
export const mulberry32 = (seed: number): Rng => {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Simulation event domains — each gets its own deterministic sub-stream. */
export const RNG_DOMAINS = [
  'economy',
  'career',
  'education',
  'health',
  'relationships',
  'family',
  'life-events',
] as const

export type RngDomain = (typeof RNG_DOMAINS)[number]

const DOMAIN_HASH: Record<RngDomain, number> = (() => {
  const map = {} as Record<RngDomain, number>
  RNG_DOMAINS.forEach((domain, index) => {
    map[domain] = hashString(`sim-domain:${domain}:${index}`)
  })
  return map
})()

/** Derive the per-life seed from a base seed and life index. */
export const deriveLifeSeed = (baseSeed: string | number, lifeIndex: number): number =>
  hashCombine(
    typeof baseSeed === 'number' ? mix32(baseSeed | 0) : hashString(String(baseSeed)),
    mix32(lifeIndex + 1),
  )

/** Derive an independent deterministic RNG for one (life, year, domain). */
export const rngFor = (lifeSeed: number, year: number, domain: RngDomain): Rng =>
  mulberry32(hashCombine(lifeSeed, mix32(year + 0x7f4a), DOMAIN_HASH[domain]))

/** Derive a life-level RNG (for initial-state sampling of unknown values). */
export const rngForLife = (lifeSeed: number, tag: string): Rng =>
  mulberry32(hashCombine(lifeSeed, hashString(`init:${tag}`)))

export const uniform = (rng: Rng, min: number, max: number): number => min + rng() * (max - min)

export const uniformInt = (rng: Rng, min: number, max: number): number =>
  Math.floor(uniform(rng, min, max + 1 - Number.EPSILON))

/** Box–Muller normal draw. Mean and standard deviation in absolute terms. */
export const normal = (rng: Rng, mean: number, stdDev: number): number => {
  const u1 = Math.max(rng(), 1e-12)
  const u2 = rng()
  const mag = Math.sqrt(-2 * Math.log(u1))
  return mean + stdDev * mag * Math.cos(2 * Math.PI * u2)
}

/** Log-normal draw via underlying normal. Always positive. */
export const logNormal = (rng: Rng, median: number, sigma: number): number =>
  Math.exp(normal(rng, Math.log(median), sigma))

/** Pick with probability p. */
export const chance = (rng: Rng, p: number): boolean => rng() < p

/** Weighted pick from a probability table (weights need not sum to 1). */
export const weightedPick = <T>(rng: Rng, entries: readonly { value: T; weight: number }[]): T => {
  const total = entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0)
  let roll = rng() * total
  for (const entry of entries) {
    roll -= Math.max(0, entry.weight)
    if (roll <= 0) return entry.value
  }
  return entries[entries.length - 1]!.value
}

/** Clamp helper used across the engine. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))
