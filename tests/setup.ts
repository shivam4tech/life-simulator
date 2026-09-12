import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { useProfileStore } from '@/app/store/profile'

afterEach(() => {
  cleanup()
  // Reset the persisted profile store between tests.
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
  useProfileStore.setState({ profile: null })
})
