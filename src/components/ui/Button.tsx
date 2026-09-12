import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-on-accent hover:bg-accent-strong shadow-sm active:translate-y-px border border-transparent',
  secondary:
    'bg-surface text-fg border border-line hover:border-line-strong hover:bg-raised active:translate-y-px',
  ghost: 'bg-transparent text-muted hover:text-fg hover:bg-raised border border-transparent',
  danger:
    'bg-transparent text-danger border border-danger/40 hover:bg-danger-soft active:translate-y-px',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}

export function Button({ variant = 'secondary', size = 'md', className, type, ...props }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded-md font-medium whitespace-nowrap',
        'transition-[background-color,border-color,color,transform] duration-150 ease-out select-none',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}
