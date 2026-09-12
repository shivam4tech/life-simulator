import type { PersonProfile } from '@/domain/person'
import type { SimulationConfig } from './types'
import type { MonteCarloRun } from './runner'
import { runMonteCarlo } from './runner'
import type { WorkerRequest } from './worker'

/**
 * Main-thread client for the simulation worker.
 * Falls back to chunked main-thread execution when workers are unavailable
 * (tests, exotic embeddings) — the engine is identical either way.
 */

export interface SimulationRunHandle {
  cancel: () => void
  promise: Promise<Outcome>
}

export type Outcome =
  | { status: 'done'; run: MonteCarloRun }
  | { status: 'cancelled' }
  | { status: 'error'; message: string }

export const runSimulationAsync = (
  profile: PersonProfile,
  config: SimulationConfig,
  numLives: number,
  onProgress: (completed: number, total: number) => void,
): SimulationRunHandle => {
  const signal = { aborted: false }

  if (typeof Worker === 'undefined') {
    // Chunked fallback so callers can still cancel between batches.
    const promise = new Promise<Outcome>((resolve) => {
      setTimeout(() => {
        try {
          const run = runMonteCarlo(profile, config, {
            numLives,
            batchSize: 100,
            signal,
            onProgress,
          })
          resolve(signal.aborted ? { status: 'cancelled' } : { status: 'done', run })
        } catch (error) {
          resolve({ status: 'error', message: error instanceof Error ? error.message : 'Simulation failed.' })
        }
      }, 0)
    })
    return { cancel: () => { signal.aborted = true }, promise }
  }

  const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
  const promise = new Promise<Outcome>((resolve) => {
    worker.addEventListener(
      'message',
      (event: MessageEvent<{ type: string; completed?: number; total?: number; run?: MonteCarloRun; message?: string }>) => {
        const data = event.data
        if (data.type === 'progress' && data.completed !== undefined && data.total !== undefined) {
          onProgress(data.completed, data.total)
        } else if (data.type === 'done' && data.run) {
          resolve({ status: 'done', run: data.run })
        } else if (data.type === 'cancelled') {
          resolve({ status: 'cancelled' })
        } else if (data.type === 'error') {
          resolve({ status: 'error', message: data.message ?? 'Simulation failed.' })
        }
      },
    )
    const request: WorkerRequest = { type: 'run', profile, config, numLives }
    worker.postMessage(request)
  }).finally(() => {
    worker.terminate()
  })

  return {
    cancel: () => {
      worker.postMessage({ type: 'cancel' } satisfies WorkerRequest)
    },
    promise,
  }
}
