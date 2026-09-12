import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** InlineNotice — contextual info/success/warning/error message. */

export type NoticeTone = 'info' | 'success' | 'warning' | 'danger'

export interface InlineNoticeProps {
  tone?: NoticeTone
  title?: string
  children: ReactNode
  className?: string
}

const toneClasses: Record<NoticeTone, string> = {
  info: 'border-accent/40 bg-accent-soft',
  success: 'border-success/40 bg-success/10',
  warning: 'border-warning/40 bg-warning/10',
  danger: 'border-danger/40 bg-danger-soft',
}

const toneText: Record<NoticeTone, string> = {
  info: 'text-accent-strong',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

export function InlineNotice({ tone = 'info', title, children, className }: InlineNoticeProps) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('rounded-md border p-3', toneClasses[tone], className)}>
      {title && <p className={cn('mb-0.5 text-xs font-semibold', toneText[tone])}>{title}</p>}
      <div className="text-xs text-muted">{children}</div>
    </div>
  )
}
