import { describe, expect, it } from 'vitest'
import {
  describeMaybe,
  known,
  isKnown,
  notApplicable,
  preferNotToAnswer,
  range,
  resolveMaybe,
  unknownValue,
} from '@/domain/values'

describe('MaybeValue', () => {
  it('resolves known values', () => {
    expect(resolveMaybe(known(42))).toBe(42)
  })

  it('resolves ranges to their midpoint', () => {
    expect(resolveMaybe(range(10, 20))).toBe(15)
  })

  it('returns null for unknown / N-A / declined values', () => {
    expect(resolveMaybe(unknownValue())).toBeNull()
    expect(resolveMaybe(notApplicable())).toBeNull()
    expect(resolveMaybe(preferNotToAnswer())).toBeNull()
  })

  it('describes values for display', () => {
    const fmt = (n: number) => `${n}`
    expect(describeMaybe(known(29), fmt)).toBe('29')
    expect(describeMaybe(range(5, 9), fmt)).toBe('5–9')
    expect(describeMaybe(unknownValue(), fmt)).toBe('Unknown')
    expect(describeMaybe(notApplicable(), fmt)).toBe('Not applicable')
    expect(describeMaybe(preferNotToAnswer(), fmt)).toBe('Prefer not to answer')
  })

  it('narrows known values', () => {
    const value: unknown = known('x')
    expect(isKnown(value as ReturnType<typeof known>)).toBe(true)
  })
})
