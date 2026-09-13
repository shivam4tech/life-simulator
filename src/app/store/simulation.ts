import { create } from 'zustand'
import type { MonteCarloRun } from '@/simulation'
import type { SimulationConfig } from '@/simulation'

interface SimulationState {
  /** Last completed Monte Carlo run (in-memory only — too large to persist). */
  run: MonteCarloRun | null
  setRun: (run: MonteCarloRun) => void
  clear: () => void
}

/**
 * Holds the most recent completed universe so the Timeline destination can
 * explore it without re-running. In-memory by design: a full run (aggregates
 * plus four representative timelines) is too large for localStorage, and a
 * replay is one click away anyway.
 */
export const useSimulationStore = create<SimulationState>()((set) => ({
  run: null,
  setRun: (run) => set({ run }),
  clear: () => set({ run: null }),
}))

export const lastRunConfig = (): SimulationConfig | null => useSimulationStore.getState().run?.config ?? null
