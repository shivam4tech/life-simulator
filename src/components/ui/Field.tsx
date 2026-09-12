import type { InputHTMLAttributes, ReactNode } from 'react'
import { useId } from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/utils/cn'

/**
 * Field — accessible form field wrapper: label, description, error.
 * Wire the ids into your input via aria-describedby (handled automatically
 * when the input is rendered through `render`).
 */

export interface FieldProps {
  label: string
  description?: ReactNode
  error?: string
  required?: boolean
  hideLabel?: boolean
  /** Render-prop receives the ids an input needs for a11y wiring. */
  render: (aria: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: boolean }) => ReactNode
  htmlFor?: string
  className?: string
}

export function Field({
  label,
  description,
  error,
  required,
  hideLabel,
  render,
  className,
}: FieldProps) {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <LabelPrimitive.Root
        htmlFor={id}
        className={cn(
          'text-xs font-medium tracking-wide text-muted',
          hideLabel && 'sr-only',
        )}
      >
        {label}
        {required && <span className="text-danger"> *</span>}
      </LabelPrimitive.Root>
      {render({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {description && (
        <p id={descriptionId} className="text-xs text-faint">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

const inputClasses = cn(
  'h-9 w-full rounded-md border border-line bg-sunken px-3 text-sm text-fg',
  'placeholder:text-faint transition-colors duration-150',
  'hover:border-line-strong focus:border-accent focus:outline-none',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-invalid:border-danger',
)

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Static adornment before the value, e.g. a currency symbol. */
  prefix?: ReactNode
  suffix?: ReactNode
}

export function TextInput({ prefix, suffix, className, ...props }: TextInputProps) {
  if (!prefix && !suffix) {
    return <input className={cn(inputClasses, className)} {...props} />
  }
  return (
    <div
      className={cn(
        'flex h-9 items-center rounded-md border border-line bg-sunken px-3',
        'transition-colors duration-150 hover:border-line-strong focus-within:border-accent',
        'has-aria-invalid:border-danger',
        className,
      )}
    >
      {prefix && <span className="mr-2 shrink-0 text-xs text-faint">{prefix}</span>}
      <input
        className="h-full w-full min-w-0 bg-transparent text-sm text-fg outline-none placeholder:text-faint"
        {...props}
      />
      {suffix && <span className="ml-2 shrink-0 text-xs text-faint">{suffix}</span>}
    </div>
  )
}
