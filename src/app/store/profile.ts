import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonProfile } from '@/domain/person'
import { DEMO_PROFILE } from '@/data/demo-profile'
import { PROFILE_SCHEMA_VERSION, PROFILE_STORAGE_KEY } from '@/data/demo-constants'

interface ProfileState {
  profile: PersonProfile | null
  setProfile: (profile: PersonProfile) => void
  clearProfile: () => void
}

/**
 * Current life profile. Versioned localStorage persistence so that a reload
 * never destroys a completed profile; migrations are handled from Sprint 2.
 */
export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      setProfile: (profile) => set({ profile }),
      clearProfile: () => set({ profile: null }),
    }),
    {
      name: PROFILE_STORAGE_KEY,
      version: PROFILE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/** Load the bundled fictional example as the active profile. */
export const loadDemoProfile = (): PersonProfile => {
  useProfileStore.getState().setProfile(DEMO_PROFILE)
  return DEMO_PROFILE
}
