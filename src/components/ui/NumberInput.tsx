import { useState } from 'react'
import type { TextInputProps } from './Field'
import { TextInput } from './Field'
import { cn } from '@/utils/cn'

/**
 * NumberInput — numeric entry with optional stepper buttons and range clamping.
 * Accepts approximate/empty input; `onChange` receives the parsed number or
 * undefined when the field is blank/invalid. Never silently rewrites the text
 * the user typed while focused.
 */

export interface NumberInputProps
  extends Omit<TextInputProps, 'value' | 'onChange' | 'type' | 'prefix' | 'suffix'> {
  value?: number
  onChange?: (value: number | undefined) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  hideSteppers?: boolean
}

const parseNumeric = (raw: string): number | undefined => {
  const normalized = raw.replace(/\s/g, '').replace(/,/g, '.')
  if (normalized === '' || normalized === '.') return undefined
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  hideSteppers,
  className,
  ...props
}: NumberInputProps) {
  const [raw, setRaw] = useState<string | null>(null)

  const commit = (next: string) => {
    setRaw(next)
    const parsed = parseNumeric(next)
    if (parsed === undefined) {
      onChange?.(undefined)
      return
    }
    let clamped = parsed
    if (min !== undefined) clamped = Math.max(min, clamped)
    if (max !== undefined) clamped = Math.min(max, clamped)
    onChange?.(clamped)
  }

  const bump = (direction: 1 | -1) => {
    const current = value ?? (direction === 1 ? (min ?? 0) : (max ?? 0))
    let next = current + direction * step
    if (min !== undefined) next = Math.max(min, next)
    if (max !== undefined) next = Math.min(max, next)
    setRaw(null)
    onChange?.(next)
  }

  const display = raw ?? (value !== undefined ? String(value) : '')

  return (
    <div className="flex items-center gap-1">
      <TextInput
        inputMode="decimal"
        value={display}
        onChange={(event) => commit(event.target.value)}
        onBlur={() => setRaw(null)}
        prefix={prefix}
        suffix={suffix}
        className={cn(!hideSteppers && 'flex-1', className)}
        {...props}
      />
      {!hideSteppers && (
        <div className="flex flex-col gap-px">
          <button
            type="button"
            aria-label="Increase value"
            className="flex h-[17px] w-6 cursor-pointer items-center justify-center rounded-sm border border-line bg-surface text-[10px] text-muted hover:border-line-strong hover:text-fg"
            onClick={() => bump(1)}
          >
            ▲
          </button>
          <button
            type="button"
            aria-label="Decrease value"
            className="flex h-[17px] w-6 cursor-pointer items-center justify-center rounded-sm border border-line bg-surface text-[10px] text-muted hover:border-line-strong hover:text-fg"
            onClick={() => bump(-1)}
          >
            ▼
          </button>
        </div>
      )}
    </div>
  )
}
