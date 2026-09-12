import { beforeEach, describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useProfileStore, loadDemoProfile } from '@/app/store/profile'
import { DEMO_PROFILE } from '@/data/demo-profile'

describe('profile store', () => {
  beforeEach(() => {
    try {
      localStorage.clear()
    } catch {
      /* ignore */
    }
    useProfileStore.setState({ profile: null })
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useProfileStore())
    expect(result.current.profile).toBeNull()
  })

  it('sets and clears a profile', () => {
    const { result } = renderHook(() => useProfileStore())
    act(() => result.current.setProfile(DEMO_PROFILE))
    expect(result.current.profile?.id).toBe(DEMO_PROFILE.id)
    act(() => result.current.clearProfile())
    expect(result.current.profile).toBeNull()
  })

  it('loads the fictional demo profile on demand', () => {
    const { result } = renderHook(() => useProfileStore())
    act(() => {
      loadDemoProfile()
    })
    expect(result.current.profile?.isFictional).toBe(true)
  })

  it('persists to localStorage and restores across a fresh store read', () => {
    const { result } = renderHook(() => useProfileStore())
    act(() => result.current.setProfile(DEMO_PROFILE))
    const raw = localStorage.getItem('life-simulator:profile')
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!) as { state: { profile: { id: string } }; version: number }
    expect(parsed.state.profile.id).toBe(DEMO_PROFILE.id)
    expect(parsed.version).toBe(1)
  })
})
