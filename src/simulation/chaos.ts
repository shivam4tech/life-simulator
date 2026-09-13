import type { WorldScenario } from './types'

/**
 * Chaos setting (Sprint 10) — the user's randomness level, layered on top of
 * the world scenario. CALM suppresses disruption; WILD amplifies it into
 * game territory. The default is always REALISTIC and never mislabelled.
 */

export type ChaosLevel = 'calm' | 'realistic' | 'volatile' | 'wild'

export const CHAOS_LEVELS: readonly { id: ChaosLevel; label: string; detail: string }[] = [
  { id: 'calm', label: 'Calm', detail: 'fewer shocks — see the structural trajectory clearly' },
  { id: 'realistic', label: 'Realistic', detail: 'normal life variability' },
  { id: 'volatile', label: 'Volatile', detail: 'elevated shock exposure' },
  { id: 'wild', label: 'Wild', detail: 'game territory — rare events made frequent' },
]

export interface ChaosModifiers {
  /** Multiplier on recession/slowdown probability. */
  disruptionMultiplier: number
  /** Multiplier on rare-event probability. */
  rareEventMultiplier: number
  /** Multiplier on macro volatility (growth/inflation σ). */
  volatilityMultiplier: number
  /** Label used in the UI. */
  label: string
}

export const CHAOS_MODIFIERS: Record<ChaosLevel, ChaosModifiers> = {
  calm: { disruptionMultiplier: 0.45, rareEventMultiplier: 0.15, volatilityMultiplier: 0.6, label: 'Calm' },
  realistic: { disruptionMultiplier: 1, rareEventMultiplier: 1, volatilityMultiplier: 1, label: 'Realistic' },
  volatile: { disruptionMultiplier: 1.6, rareEventMultiplier: 2.2, volatilityMultiplier: 1.4, label: 'Volatile' },
  wild: { disruptionMultiplier: 2.5, rareEventMultiplier: 5, volatilityMultiplier: 2.2, label: 'Wild' },
}

/** The world scenario captures external conditions; chaos captures the DICE. */
export type EffectiveScenario = WorldScenario

export const isRealisticChaos = (level: ChaosLevel): boolean => level === 'realistic'
