import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Metric — label/value pair for readable data. Values use tabular numerals. */

export interface MetricProps {
  label: string
  value: ReactNode
  hint?: string
  /** Optional delta/annotation line, e.g. "+12% vs 2030". */
  annotation?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const valueSizes = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
} as const

export function Metric({ label, value, hint, annotation, size = 'md', className }: MetricProps) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="text-[11px] font-medium tracking-wide text-faint uppercase">{label}</span>
      <span className={cn('tnum font-medium text-fg', valueSizes[size])}>{value}</span>
      {annotation && <span className="text-xs text-muted">{annotation}</span>}
      {hint && <span className="text-xs text-faint">{hint}</span>}
    </div>
  )
}
