import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { useProfileStore } from '@/app/store/profile'
import { useOnboardingStore } from '@/app/store/onboarding'
import { emptyDraft } from '@/app/store/onboarding'

afterEach(() => {
  cleanup()
  // Reset persisted stores between tests.
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
  useProfileStore.setState({ profile: null })
  useOnboardingStore.setState({ draft: emptyDraft(), stepIndex: 0 })
})
