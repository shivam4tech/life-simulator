/**
 * MaybeValue — how the simulator represents incomplete knowledge about a person.
 *
 * Real lives contain unknowns, approximations and questions people decline to
 * answer. The domain never collapses these into a single guessed number; UI and
 * simulation can each decide how to treat them (e.g. widen uncertainty).
 */

export interface Known<T> {
  kind: 'known'
  value: T
}

export interface UnknownValue {
  kind: 'unknown'
}

export interface ValueRange<T extends number> {
  kind: 'range'
  min: T
  max: T
}

export interface NotApplicable {
  kind: 'not-applicable'
}

export interface PreferNotToAnswer {
  kind: 'prefer-not-to-answer'
}

export type MaybeValue<T> =
  | Known<T>
  | UnknownValue
  | ValueRange<number>
  | NotApplicable
  | PreferNotToAnswer

export const known = <T>(value: T): Known<T> => ({ kind: 'known', value })
export const unknownValue = (): UnknownValue => ({ kind: 'unknown' })
export const range = (min: number, max: number): ValueRange<number> => ({ kind: 'range', min, max })
export const notApplicable = (): NotApplicable => ({ kind: 'not-applicable' })
export const preferNotToAnswer = (): PreferNotToAnswer => ({ kind: 'prefer-not-to-answer' })

/** Resolve to a single number: known value, midpoint of a range, or null. */
export const resolveMaybe = (value: MaybeValue<number>): number | null => {
  switch (value.kind) {
    case 'known':
      return value.value
    case 'range':
      return (value.min + value.max) / 2
    default:
      return null
  }
}

/** Human-readable shape of a value, given a formatter for concrete numbers. */
export const describeMaybe = (
  value: MaybeValue<number>,
  format: (n: number) => string,
): string => {
  switch (value.kind) {
    case 'known':
      return format(value.value)
    case 'range':
      return `${format(value.min)}–${format(value.max)}`
    case 'unknown':
      return 'Unknown'
    case 'not-applicable':
      return 'Not applicable'
    case 'prefer-not-to-answer':
      return 'Prefer not to answer'
  }
}

export const isKnown = <T>(value: MaybeValue<T>): value is Known<T> => value.kind === 'known'
