/// <reference lib="webworker" />
import type { PersonProfile } from '@/domain/person'
import type { SimulationConfig } from './types'
import { runMonteCarlo } from './runner'

/**
 * Web Worker wrapper — keeps the main thread free during large Monte Carlo
 * runs. Protocol:
 *   in:  { type: 'run'; profile; config; numLives }
 *   out: { type: 'progress'; completed; total }
 *        { type: 'done'; run } | { type: 'error'; message }
 *        { type: 'cancelled' }
 * Cancellation: post { type: 'cancel' }; the runner checks between batches.
 */

export interface WorkerRequest {
  type: 'run' | 'cancel'
  profile?: PersonProfile
  config?: SimulationConfig
  numLives?: number
}

let aborted = false

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const message = event.data
  if (message.type === 'cancel') {
    aborted = true
    return
  }
  if (message.type === 'run' && message.profile && message.config && message.numLives) {
    aborted = false
    try {
      const run = runMonteCarlo(message.profile, message.config, {
        numLives: message.numLives,
        batchSize: 250,
        signal: { get aborted() {
          return aborted
        } },
        onProgress: (completed, total) => {
          ;(self as unknown as Worker).postMessage({ type: 'progress', completed, total })
        },
      })
      ;(self as unknown as Worker).postMessage(
        aborted ? { type: 'cancelled' } : { type: 'done', run },
      )
    } catch (error) {
      ;(self as unknown as Worker).postMessage({
        type: 'error',
        message: error instanceof Error ? error.message : 'Simulation failed for an unknown reason.',
      })
    }
  }
})
