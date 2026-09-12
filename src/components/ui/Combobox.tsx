import * as PopoverPrimitive from '@radix-ui/react-popover'
import { Command } from 'cmdk'
import { cn } from '@/utils/cn'

/**
 * Combobox — searchable dropdown for long lists (countries, occupation families).
 * Built on cmdk for keyboard-first interaction.
 */

export interface ComboboxOption<T extends string> {
  value: T
  label: string
  /** Optional secondary line, e.g. currency or region. */
  detail?: string
  /** Extra keywords that should match the search. */
  keywords?: string[]
}

export interface ComboboxProps<T extends string> {
  options: readonly ComboboxOption<T>[]
  value: T | undefined
  onChange: (value: T) => void
  placeholder?: string
  searchPlaceholder?: string
  'aria-label': string
  emptyMessage?: string
  className?: string
}

export function Combobox<T extends string>({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches',
  className,
  ...props
}: ComboboxProps<T>) {
  const selected = options.find((option) => option.value === value)

  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger
        className={cn(
          'flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-line',
          'bg-sunken px-3 text-sm transition-colors duration-150',
          'hover:border-line-strong focus:border-accent focus:outline-none',
          className,
        )}
        {...props}
      >
        <span className={cn('truncate', selected ? 'text-fg' : 'text-faint')}>
          {selected ? selected.label : placeholder}
        </span>
        <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-faint" fill="none" aria-hidden="true">
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          sideOffset={4}
          align="start"
          className={cn(
            'z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md',
            'border border-line-strong bg-raised shadow-[var(--shadow-overlay)]',
          )}
        >
          <Command shouldFilter>
            <div className="border-b border-line">
              <Command.Input
                autoFocus
                placeholder={searchPlaceholder}
                className="h-9 w-full bg-transparent px-3 text-sm text-fg outline-none placeholder:text-faint"
              />
            </div>
            <Command.List className="max-h-64 overflow-y-auto p-1">
              <Command.Empty className="px-2.5 py-3 text-center text-xs text-faint">
                {emptyMessage}
              </Command.Empty>
              {options.map((option) => (
                <Command.Item
                  key={option.value}
                  value={`${option.label} ${option.detail ?? ''} ${(option.keywords ?? []).join(' ')}`}
                  onSelect={() => onChange(option.value)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 py-1.5 text-sm',
                    'text-muted data-[selected=true]:bg-accent-soft data-[selected=true]:text-fg',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.detail && (
                    <span className="shrink-0 text-[11px] text-faint tnum">{option.detail}</span>
                  )}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
