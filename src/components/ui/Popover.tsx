import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

export function Popover({ trigger, children, align = 'start', side = 'bottom', className }: PopoverProps) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          side={side}
          sideOffset={6}
          className={cn(
            'z-50 w-72 rounded-md border border-line-strong bg-raised p-3 text-sm text-fg',
            'shadow-[var(--shadow-overlay)] focus:outline-none',
            className,
          )}
        >
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
