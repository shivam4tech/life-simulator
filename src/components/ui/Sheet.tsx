import * as DialogPrimitive from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * Sheet — a Dialog variant docked to the right edge on desktop and the bottom
 * edge on small screens. Prefer it for contextual inspectors and long forms.
 */

export const SheetClose = DialogPrimitive.Close

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/55" />
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 flex flex-col border-line-strong bg-surface shadow-[var(--shadow-overlay)] focus:outline-none',
            // Bottom sheet on small screens, right dock from md up.
            'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-lg border-t',
            'md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[26rem] md:rounded-t-none md:rounded-l-lg md:border-t-0 md:border-l',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line p-4">
            <div>
              <DialogPrimitive.Title className="font-display text-sm font-semibold text-fg">
                {title}
              </DialogPrimitive.Title>
              {description && (
                <DialogPrimitive.Description className="mt-0.5 text-xs text-muted">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close
              aria-label="Close panel"
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-faint transition-colors duration-150 hover:bg-raised hover:text-fg"
            >
              <svg viewBox="0 0 16 16" className="size-3.5" fill="none" aria-hidden="true">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
