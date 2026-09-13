import { create } from 'zustand'
import type { Intervention } from '@/simulation'

export interface SavedBranch {
  id: string
  name: string
  createdAt: string
  horizonYears: number
  seed: string
  worldScenario: 'optimistic' | 'stable' | 'difficult' | 'volatile'
  interventions: Intervention[]
  /** Compact result summary for the branch list. */
  summary?: {
    scenarioAheadShare: number
    incomeDeltaPct: number | null
    breakEvenYearIndex: number | null
  }
}

interface ScenarioLabState {
  branches: SavedBranch[]
  saveBranch: (branch: SavedBranch) => void
  renameBranch: (id: string, name: string) => void
  duplicateBranch: (id: string) => void
  deleteBranch: (id: string) => void
}

let counter = 0
const makeId = (): string => `branch-${Date.now().toString(36)}-${counter++}`

/**
 * Saved Decision Lab branches (in-memory — comparisons are cheap to re-run
 * and the paired results are too large for localStorage).
 */
export const useScenarioLabStore = create<ScenarioLabState>()((set) => ({
  branches: [],
  saveBranch: (branch) =>
    set((state) => ({ branches: [{ ...branch, id: branch.id || makeId() }, ...state.branches].slice(0, 12) })),
  renameBranch: (id, name) =>
    set((state) => ({
      branches: state.branches.map((branch) => (branch.id === id ? { ...branch, name } : branch)),
    })),
  duplicateBranch: (id) =>
    set((state) => {
      const original = state.branches.find((branch) => branch.id === id)
      if (!original) return state
      const copy: SavedBranch = {
        ...original,
        id: makeId(),
        name: `${original.name} (copy)`,
        createdAt: new Date().toISOString(),
      }
      return { branches: [copy, ...state.branches] }
    }),
  deleteBranch: (id) =>
    set((state) => ({ branches: state.branches.filter((branch) => branch.id !== id) })),
}))
