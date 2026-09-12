import { cn } from '@/utils/cn'

export interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-line', className)} />
}
