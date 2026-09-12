import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Dialog — modal overlay. Sheet (side/bottom panel) lives in Sheet.tsx. */

export const DialogClose = DialogPrimitive.Close

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, title, description, children, className }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/55 data-[state=open]:animate-in" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-lg border border-line-strong bg-surface p-5 shadow-[var(--shadow-overlay)] focus:outline-none',
            className,
          )}
        >
          <DialogPrimitive.Title className="font-display text-base font-semibold text-fg">
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="mt-1 text-xs text-muted">
              {description}
            </DialogPrimitive.Description>
          )}
          <div className="mt-4">{children}</div>
          <DialogPrimitive.Close
            aria-label="Close dialog"
            className="absolute top-3 right-3 flex size-7 cursor-pointer items-center justify-center rounded-md text-faint transition-colors duration-150 hover:bg-raised hover:text-fg"
          >
            <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
