import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/utils/cn'

/** Select — radix-backed dropdown for short lists. Use Combobox for long lists. */

export interface SelectOption<T extends string> {
  value: T
  label: string
}

export interface SelectProps<T extends string> {
  options: readonly SelectOption<T>[]
  value: T | undefined
  onChange: (value: T) => void
  placeholder?: string
  'aria-label': string
  className?: string
  disabled?: boolean
}

const ChevronDown = () => (
  <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" fill="none" aria-hidden="true">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const Check = () => (
  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

export function Select<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  className,
  disabled,
  ...props
}: SelectProps<T>) {
  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={(next) => onChange(next as T)}
      disabled={disabled}
      {...props}
    >
      <SelectPrimitive.Trigger
        className={cn(
          'flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-line',
          'bg-sunken px-3 text-sm text-fg transition-colors duration-150',
          'hover:border-line-strong focus:border-accent focus:outline-none',
          'data-[placeholder]:text-faint disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className={cn(
            'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md',
            'border border-line-strong bg-raised shadow-[var(--shadow-overlay)]',
          )}
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-sm px-2.5 py-1.5 text-sm',
                  'text-muted outline-none data-[highlighted]:bg-accent-soft data-[highlighted]:text-fg',
                )}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
