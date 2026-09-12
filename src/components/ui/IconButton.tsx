import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons must be named for screen readers. */
  'aria-label': string
  size?: 'sm' | 'md'
}

export function IconButton({ size = 'md', className, type, ...props }: IconButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent',
        'text-muted transition-colors duration-150 ease-out hover:bg-raised hover:text-fg',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' ? 'size-7' : 'size-9',
        className,
      )}
      {...props}
    />
  )
}
