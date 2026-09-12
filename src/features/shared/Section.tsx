import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

/** Section — quiet content grouping used by pages. Not a card factory: just a heading and rules. */
export function Section({
  title,
  children,
  className,
  aside,
}: {
  title: string
  children: ReactNode
  className?: string
  aside?: ReactNode
}) {
  return (
    <section className={cn('border-t border-line pt-4', className)}>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-[11px] font-semibold tracking-[0.14em] text-faint uppercase">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}
