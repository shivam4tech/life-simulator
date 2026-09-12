import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from '@/app/App'

const renderApp = (initialPath = '/') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>,
  )

describe('app shell', () => {
  it('renders the landing page with the primary actions', () => {
    renderApp('/')
    expect(screen.getByRole('heading', { name: /your future is not one line/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create my life/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try an example/i })).toBeInTheDocument()
  })

  it('renders the My Life empty state when no profile exists', () => {
    renderApp('/my-life')
    expect(screen.getByText(/no life here yet/i)).toBeInTheDocument()
  })

  it('renders placeholder pages with their sprint labels', () => {
    renderApp('/timeline')
    expect(screen.getByText(/arrives in sprint 4/i)).toBeInTheDocument()
  })

  it('renders the assumptions page with placeholder-model disclosure', () => {
    renderApp('/assumptions')
    expect(screen.getByText(/placeholder economic model/i)).toBeInTheDocument()
  })

  it('renders primary navigation in the document', () => {
    renderApp('/')
    // Desktop rail + mobile bottom bar both carry the primary navigation.
    const navs = screen.getAllByRole('navigation', { name: /primary/i })
    expect(navs.length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByRole('link', { name: /my life/i }).length).toBeGreaterThan(0)
  })
})
