import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/**
 * EmptyState — quiet placeholder with exactly one clear next action.
 */

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  /** The single primary action a user can take from here. */
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line px-6 py-12 text-center',
        className,
      )}
    >
      {icon && <div className="mb-1 text-faint">{icon}</div>}
      <p className="font-display text-sm font-semibold text-fg">{title}</p>
      {description && <p className="max-w-sm text-xs text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
