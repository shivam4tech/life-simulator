import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import {
  emptyDraft,
  moneyCurrenciesInUse,
  ONBOARDING_STEP_IDS,
  useOnboardingStore,
} from '@/app/store/onboarding'
import { useProfileStore } from '@/app/store/profile'
import { known, monthlyMoney, unknownValue } from '@/domain'

describe('onboarding store', () => {
  beforeEach(() => {
    try {
      localStorage.clear()
    } catch {
      /* ignore */
    }
    useOnboardingStore.setState({ draft: emptyDraft(), stepIndex: 0 })
    useProfileStore.setState({ profile: null })
  })

  it('starts with an empty draft at chapter zero', () => {
    const { result } = renderHook(() => useOnboardingStore())
    expect(result.current.stepIndex).toBe(0)
    expect(result.current.draft.demographics.countryOfResidence).toBe('')
  })

  it('patches sections immutably', () => {
    const { result } = renderHook(() => useOnboardingStore())
    act(() =>
      result.current.patch((d) => ({
        ...d,
        demographics: { ...d.demographics, countryOfResidence: 'GH' },
      })),
    )
    expect(result.current.draft.demographics.countryOfResidence).toBe('GH')
    expect(result.current.draft.demographics.age?.kind).toBe('unknown')
  })

  it('clamps step navigation to valid bounds', () => {
    const { result } = renderHook(() => useOnboardingStore())
    act(() => result.current.setStep(99))
    expect(result.current.stepIndex).toBe(ONBOARDING_STEP_IDS.length - 1)
    act(() => result.current.setStep(-5))
    expect(result.current.stepIndex).toBe(0)
  })

  it('persists the draft to localStorage', () => {
    const { result } = renderHook(() => useOnboardingStore())
    act(() =>
      result.current.patch((d) => ({
        ...d,
        employment: { grossIncome: known(monthlyMoney(5000, 'GHS')) },
      })),
    )
    const raw = localStorage.getItem('life-simulator:onboarding')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as { state: { draft: { employment?: { grossIncome?: { kind: string } } } } }
    expect(parsed.state.draft.employment?.grossIncome?.kind).toBe('known')
  })

  it('complete() saves the profile and resets the draft', () => {
    const { result } = renderHook(() => useOnboardingStore())
    act(() =>
      result.current.patch((d) => ({
        ...d,
        displayName: 'Test life',
        demographics: { ...d.demographics, countryOfResidence: 'GH', age: known(30) },
      })),
    )
    let savedId = ''
    act(() => {
      savedId = result.current.complete().id
    })
    expect(savedId).not.toBe('draft')
    const profile = useProfileStore.getState().profile
    expect(profile?.displayName).toBe('Test life')
    expect(profile?.demographics.age?.kind).toBe('known')
    expect(useOnboardingStore.getState().draft.id).toBe('draft')
    expect(useOnboardingStore.getState().stepIndex).toBe(0)
  })

  it('collects distinct currencies already entered', () => {
    const profile = emptyDraft()
    profile.employment = { grossIncome: known(monthlyMoney(1, 'GHS')) }
    profile.finances = { savings: known(monthlyMoney(2, 'GHS')), debt: known(monthlyMoney(3, 'EUR')) }
    expect(moneyCurrenciesInUse(profile).sort()).toEqual(['EUR', 'GHS'])
    const empty = emptyDraft()
    empty.demographics.age = unknownValue()
    expect(moneyCurrenciesInUse(empty)).toEqual([])
  })
})
