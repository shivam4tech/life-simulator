import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersonProfile } from '@/domain'
import { SIMULATION_ENGINE_VERSION } from './index'

/**
 * Save slots (Sprint 10) — multiple named lives, versioned, exportable.
 * localStorage-backed with autosave; schema versioned for future migrations.
 */

export const SAVE_SLOTS_KEY = 'life-simulator:save-slots'
export const SAVE_SLOTS_VERSION = 1
const MAX_SLOTS = 12

export interface SaveSlot {
  id: string
  name: string
  profile: PersonProfile
  savedAt: string
  engineVersion: string
  /** Stripped of display name and city for privacy-safe sharing. */
}

export interface SaveSlotsState {
  slots: SaveSlot[]
  saveSlot: (name: string, profile: PersonProfile) => SaveSlot
  loadSlot: (id: string) => PersonProfile | null
  deleteSlot: (id: string) => void
  renameSlot: (id: string, name: string) => void
}

export const useSaveSlotsStore = create<SaveSlotsState>()(
  persist(
    (set, get) => ({
      slots: [],
      saveSlot: (name, profile) => {
        const slot: SaveSlot = {
          id: `slot-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`,
          name: name.trim() || 'Untitled life',
          profile,
          savedAt: new Date().toISOString(),
          engineVersion: SIMULATION_ENGINE_VERSION,
        }
        set((state) => ({ slots: [slot, ...state.slots].slice(0, MAX_SLOTS) }))
        return slot
      },
      loadSlot: (id) => get().slots.find((slot) => slot.id === id)?.profile ?? null,
      deleteSlot: (id) => set((state) => ({ slots: state.slots.filter((slot) => slot.id !== id) })),
      renameSlot: (id, name) =>
        set((state) => ({
          slots: state.slots.map((slot) => (slot.id === id ? { ...slot, name: name.trim() || slot.name } : slot)),
        })),
    }),
    {
      name: SAVE_SLOTS_KEY,
      version: SAVE_SLOTS_VERSION,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/* --------------------------- export / import ----------------------------- */

export interface SharePayload {
  kind: 'life-simulator-share'
  version: 1
  engineVersion: string
  exportedAt: string
  /** Privacy-safe profile: display name and city stripped. */
  profile: PersonProfile
}

/** Strip identifying fields for privacy-safe sharing. */
export const sanitiseForShare = (profile: PersonProfile): PersonProfile => ({
  ...profile,
  displayName: undefined,
  demographics: {
    ...profile.demographics,
    city: undefined,
    region: undefined,
  },
})

export const exportLife = (profile: PersonProfile): SharePayload => ({
  kind: 'life-simulator-share',
  version: 1,
  engineVersion: SIMULATION_ENGINE_VERSION,
  exportedAt: new Date().toISOString(),
  profile: sanitiseForShare(profile),
})

export const exportLifeJson = (profile: PersonProfile): string =>
  JSON.stringify(exportLife(profile), null, 2)

export const importLifeJson = (json: string): PersonProfile | null => {
  try {
    const parsed = JSON.parse(json) as Partial<SharePayload>
    if (parsed.kind !== 'life-simulator-share' || !parsed.profile?.demographics) return null
    return parsed.profile as PersonProfile
  } catch {
    return null
  }
}
