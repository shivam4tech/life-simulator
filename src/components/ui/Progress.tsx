import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/utils/cn'

export interface ProgressProps {
  /** 0–1 fraction. */
  value: number
  'aria-label': string
  className?: string
}

export function Progress({ value, className, ...props }: ProgressProps) {
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <ProgressPrimitive.Root
      value={clamped * 100}
      className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-line', className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-accent transition-transform duration-200 ease-out"
        style={{ transform: `translateX(-${100 - clamped * 100}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
