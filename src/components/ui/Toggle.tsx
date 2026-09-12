import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/utils/cn'

export interface ToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  id?: string
}

export function Toggle({ checked, onCheckedChange, label, description, disabled, id }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start justify-between gap-4 rounded-md py-1',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span className="flex flex-col gap-0.5">
        <span className="text-sm text-fg">{label}</span>
        {description && <span className="text-xs text-faint">{description}</span>}
      </span>
      <SwitchPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full border border-line transition-colors duration-150',
          'data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=unchecked]:bg-sunken',
        )}
      >
        <SwitchPrimitive.Thumb
          className={cn(
            'block size-4 translate-x-0.5 rounded-full bg-fg shadow transition-transform duration-150 ease-out',
            'data-[state=checked]:translate-x-[18px] data-[state=checked]:bg-on-accent',
          )}
        />
      </SwitchPrimitive.Root>
    </label>
  )
}
