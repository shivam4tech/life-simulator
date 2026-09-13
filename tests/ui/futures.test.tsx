import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from '@/app/App'
import { useSimulationStore } from '@/app/store/simulation'
import { useProfileStore } from '@/app/store/profile'
import { runMonteCarlo } from '@/simulation/runner'
import type { SimulationConfig } from '@/simulation'
import { DEMO_PROFILE } from '@/data/demo-profile'

const config: SimulationConfig = {
  seed: 'ui-universe',
  worldScenario: 'stable',
  horizonYears: 6,
  startCalendarYear: 2026,
}

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

describe('futures explorer', () => {
  const run = runMonteCarlo(DEMO_PROFILE, config, { numLives: 40 })

  it('renders the full explorer for a completed run', () => {
    act(() => {
      useProfileStore.setState({ profile: DEMO_PROFILE })
      useSimulationStore.setState({ run })
    })
    renderAt('/timeline')
    expect(screen.getByText(/futures generated/i)).toBeInTheDocument()
    expect(screen.getByText(/outcome dimensions at age/i)).toBeInTheDocument()
    expect(screen.getByText(/why did this life happen\?/i)).toBeInTheDocument()
    expect(screen.getByText(/major model contributors/i)).toBeInTheDocument()
    // Band switching control exists.
    expect(screen.getByRole('radio', { name: 'Exceptional' }) ?? screen.getAllByRole('button', { name: /exceptional/i })[0]).toBeTruthy()
  })

  it('shows representative-life seeds unobtrusively', () => {
    act(() => {
      useProfileStore.setState({ profile: DEMO_PROFILE })
      useSimulationStore.setState({ run })
    })
    renderAt('/timeline')
    expect(screen.getAllByText(/seed/i).length).toBeGreaterThan(0)
  })
})
