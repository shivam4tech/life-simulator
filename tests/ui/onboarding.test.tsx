import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { App } from '@/app/App'
import { useOnboardingStore } from '@/app/store/onboarding'
import { emptyDraft } from '@/app/store/onboarding'

const renderCreate = () =>
  render(
    <MemoryRouter initialEntries={['/create']}>
      <App />
    </MemoryRouter>,
  )

describe('onboarding flow', () => {
  it('renders the first chapter with progress and chapter navigation', () => {
    renderCreate()
    expect(screen.getByText(/build your present/i)).toBeInTheDocument()
    expect(screen.getByText(/chapter 1 of 12/i)).toBeInTheDocument()
    // Mobile chips + desktop rail both carry the chapter navigation.
    expect(screen.getAllByRole('navigation', { name: /onboarding chapters/i }).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
  })

  it('navigates between chapters via the store-driven UI', () => {
    renderCreate()
    act(() => {
      useOnboardingStore.getState().setStep(4)
    })
    expect(screen.getByText(/chapter 5 of 12/i)).toBeInTheDocument()
    // Money chapter note: income lives in the Work chapter.
    expect(screen.getByText(/gross income is captured in the work chapter/i)).toBeInTheDocument()
  })

  it('shows the review chapter with save action and warnings area', () => {
    renderCreate()
    act(() => {
      useOnboardingStore.getState().setStep(11)
    })
    expect(screen.getByText(/name this life/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save this life/i })).toBeDisabled()
  })

  it('resumes from a stored draft state', () => {
    act(() => {
      useOnboardingStore.setState({
        draft: {
          ...emptyDraft(),
          demographics: { ...emptyDraft().demographics, countryOfResidence: 'BR' },
        },
        stepIndex: 2,
      })
    })
    renderCreate()
    expect(screen.getByText(/chapter 3 of 12/i)).toBeInTheDocument()
  })
})
