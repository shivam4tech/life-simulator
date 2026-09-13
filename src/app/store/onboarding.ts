import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PersonProfile } from '@/domain/person'
import { useProfileStore } from './profile'
import { ONBOARDING_STORAGE_KEY, ONBOARDING_SCHEMA_VERSION } from '@/data/demo-constants'

export const ONBOARDING_STEP_IDS = [
  'you',
  'where',
  'education',
  'work',
  'money',
  'household',
  'relationships',
  'health',
  'behaviour',
  'goals',
  'constraints',
  'review',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number]

/** A fresh draft: nothing assumed except an empty identity shell. */
export const emptyDraft = (): PersonProfile => ({
  id: 'draft',
  createdAt: new Date().toISOString(),
  demographics: { age: { kind: 'unknown' }, countryOfResidence: '', citizenships: [] },
})

interface OnboardingState {
  draft: PersonProfile
  stepIndex: number
  /** Immutable-style patch: the mutator receives a copy and returns the next draft. */
  patch: (mutate: (draft: PersonProfile) => PersonProfile) => void
  setStep: (index: number) => void
  reset: () => void
  /** Finalise the draft into a saved profile and clear the draft. */
  complete: () => PersonProfile
}

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `profile-${Date.now().toString(36)}`
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      draft: emptyDraft(),
      stepIndex: 0,
      patch: (mutate) =>
        set((state) => {
          const next = mutate({ ...state.draft })
          return { draft: next }
        }),
      setStep: (stepIndex) =>
        set({
          stepIndex: Math.max(0, Math.min(ONBOARDING_STEP_IDS.length - 1, stepIndex)),
        }),
      reset: () => set({ draft: emptyDraft(), stepIndex: 0 }),
      complete: () => {
        const { draft } = useOnboardingStore.getState()
        const finalProfile: PersonProfile = {
          ...draft,
          id: draft.id === 'draft' ? makeId() : draft.id,
          createdAt: new Date().toISOString(),
        }
        useProfileStore.getState().setProfile(finalProfile)
        set({ draft: emptyDraft(), stepIndex: 0 })
        return finalProfile
      },
    }),
    {
      name: ONBOARDING_STORAGE_KEY,
      version: ONBOARDING_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

/** Distinct currencies already entered in money fields (for currency-change notices). */
export const moneyCurrenciesInUse = (profile: PersonProfile): string[] => {
  const currencies = new Set<string>()
  const maybeAmounts = [
    profile.employment?.grossIncome,
    profile.finances?.savings,
    profile.finances?.emergencySavings,
    profile.finances?.investments,
    profile.finances?.majorAssets,
    profile.finances?.debt,
    profile.finances?.housingCost,
    profile.finances?.essentialMonthlyExpenses,
    profile.finances?.discretionaryMonthlySpending,
  ]
  for (const amount of maybeAmounts) {
    if (amount && amount.kind === 'known') currencies.add(amount.value.currency)
  }
  return [...currencies]
}
