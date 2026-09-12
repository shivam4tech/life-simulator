import { Info } from './icons'
import { Popover } from './Popover'
import { cn } from '@/utils/cn'

/**
 * ContextualHelp — a small "?" affordance opening a short explanation.
 * Click-based (not hover-only) so it works on touch and keyboard.
 */

export interface ContextualHelpProps {
  explanation: string
  label?: string
  className?: string
}

export function ContextualHelp({ explanation, label = 'What is this?', className }: ContextualHelpProps) {
  return (
    <Popover
      side="top"
      align="end"
      trigger={
        <button
          type="button"
          aria-label={label}
          className={cn(
            'flex size-5 cursor-pointer items-center justify-center rounded-full border border-line',
            'text-[10px] font-semibold text-faint transition-colors duration-150 hover:border-line-strong hover:text-fg',
            className,
          )}
        >
          ?
        </button>
      }
      className="w-64"
    >
      <div className="flex gap-2">
        <span className="mt-0.5 text-faint">
          <Info />
        </span>
        <p className="text-xs text-muted">{explanation}</p>
      </div>
    </Popover>
  )
}
