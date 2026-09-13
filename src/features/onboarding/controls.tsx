import type { MaybeValue, MoneyAmount, MoneyPeriod } from '@/domain'
import { known, unknownValue } from '@/domain'
import { NumberInput, Select, Slider, type SelectOption } from '@/components/ui'

/**
 * Onboarding controls — every input has an honest "unknown" path, because
 * incomplete knowledge is a normal state, not a failure.
 */

/** Small checkbox-styled "Not sure" affordance. */
const NotSure = ({
  checked,
  onChange,
  label = 'Not sure',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}) => (
  <label className="flex cursor-pointer items-center gap-1.5 text-[11px] text-faint transition-colors hover:text-muted">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="size-3.5 accent-[var(--accent)]"
    />
    {label}
  </label>
)

export interface OptionalSliderProps {
  label: string
  /** undefined = unknown. */
  value: number | undefined
  onChange: (value: number | undefined) => void
  min?: number
  max?: number
  lowLabel?: string
  highLabel?: string
  hint?: string
}

/** Bipolar slider with a "Not sure" escape hatch (0–10 scales by default). */
export function OptionalSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  lowLabel,
  highLabel,
  hint,
}: OptionalSliderProps) {
  const unsure = value === undefined
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <div className="flex items-center gap-3">
          {!unsure && (
            <span className="text-[11px] text-faint tnum">
              {lowLabel && value! <= (min + max) / 3
                ? lowLabel
                : highLabel && value! >= (min + max) * 2 / 3
                  ? highLabel
                  : 'Moderate'}
            </span>
          )}
          <NotSure checked={unsure} onChange={(checked) => onChange(checked ? undefined : Math.round((min + max) / 2))} />
        </div>
      </div>
      {unsure ? (
        <p className="flex h-5 items-center text-[11px] text-faint italic">Skipped — treated as unknown</p>
      ) : (
        <Slider
          aria-label={label}
          value={value!}
          onChange={(next) => onChange(next)}
          min={min}
          max={max}
          lowLabel={lowLabel}
          highLabel={highLabel}
        />
      )}
      {hint && <p className="text-[11px] text-faint">{hint}</p>}
    </div>
  )
}

export interface MaybeNumberInputProps {
  label: string
  /** Field absent or unknownValue() both read as unknown. */
  value: MaybeValue<number> | undefined
  onChange: (value: MaybeValue<number> | undefined) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  hint?: string
}

export function MaybeNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  hint,
}: MaybeNumberInputProps) {
  const resolved = value && value.kind === 'known' ? value.value : undefined
  const unsure = resolved === undefined
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted">{label}</span>
        <NotSure checked={unsure} onChange={(checked) => onChange(checked ? unknownValue() : known(Math.max(0, min ?? 0)))} />
      </div>
      <NumberInput
        aria-label={label}
        value={resolved}
        onChange={(next) => onChange(next === undefined ? unknownValue() : known(next))}
        min={min}
        max={max}
        step={step}
        prefix={prefix}
        suffix={suffix}
        placeholder={unsure ? 'Not sure' : undefined}
        hideSteppers
      />
      {hint && <p className="text-[11px] text-faint">{hint}</p>}
    </div>
  )
}

export interface MoneyInputProps {
  label: string
  value: MaybeValue<MoneyAmount> | undefined
  onChange: (value: MaybeValue<MoneyAmount> | undefined) => void
  /** Currency used when the user first enters an amount. */
  currency: string
  /** Stocks have no period; flows are monthly. */
  period?: MoneyPeriod
  hint?: string
}

export function MoneyInput({ label, value, onChange, currency, period, hint }: MoneyInputProps) {
  const knownAmount = value && value.kind === 'known' ? value.value : undefined
  const resolved = knownAmount?.value
  const unsure = resolved === undefined
  const activeCurrency = knownAmount?.currency ?? currency
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-muted">
          {label}
          {period === 'month' && <span className="ml-1 text-faint">/ month</span>}
        </span>
        <NotSure
          checked={unsure}
          onChange={(checked) =>
            onChange(checked ? unknownValue() : known({ value: 0, currency, ...(period ? { period } : {}) }))
          }
        />
      </div>
      {unsure ? (
        <p className="text-[11px] text-faint italic">Unknown</p>
      ) : (
        <NumberInput
          aria-label={label}
          value={resolved}
          onChange={(next) =>
            onChange(
              next === undefined || next < 0
                ? unknownValue()
                : known({ value: next, currency: activeCurrency, ...(period ? { period } : {}) }),
            )
          }
          min={0}
          prefix={activeCurrency}
          hideSteppers
        />
      )}
      {hint && <p className="text-[11px] text-faint">{hint}</p>}
    </div>
  )
}

export interface OptionalSelectProps<T extends string> {
  label: string
  options: readonly SelectOption<T>[]
  value: T | undefined
  onChange: (value: T | undefined) => void
  placeholder?: string
  hint?: string
}

/** Select whose value can be cleared back to "not specified". */
export function OptionalSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Prefer not to answer',
  hint,
}: OptionalSelectProps<T>) {
  const selectOptions: readonly SelectOption<T | 'unset'>[] = value
    ? [...options, { value: 'unset', label: 'Not specified' }]
    : options
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <Select
        aria-label={label}
        options={selectOptions}
        value={value}
        placeholder={placeholder}
        onChange={(next) => onChange(next === 'unset' ? undefined : (next as T))}
      />
      {hint && <p className="text-[11px] text-faint">{hint}</p>}
    </div>
  )
}
