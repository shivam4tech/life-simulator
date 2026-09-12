import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import { cn } from '@/utils/cn'

/**
 * SegmentedControl — small mutually exclusive choices.
 * Options are short labels; use a Select/Combobox for longer lists.
 */

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  hint?: string
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  'aria-label': string
  size?: 'sm' | 'md'
  className?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ...props
}: SegmentedControlProps<T>) {
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        // Radix emits '' when clicking the active item; keep a stable selection.
        if (next) onChange(next as T)
      }}
      className={cn(
        'inline-flex items-center gap-0.5 rounded-md border border-line bg-sunken p-0.5',
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <ToggleGroupPrimitive.Item
          key={option.value}
          value={option.value}
          title={option.hint}
          className={cn(
            'cursor-pointer rounded-sm font-medium whitespace-nowrap transition-colors duration-150 ease-out',
            'text-muted hover:text-fg',
            'data-[state=on]:bg-raised data-[state=on]:text-fg data-[state=on]:shadow-sm',
            size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-3 text-xs',
          )}
        >
          {option.label}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  )
}
