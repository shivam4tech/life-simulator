import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/utils/cn'

/**
 * Slider — continuous input with an optional bipolar label pair
 * (e.g. "Prefer certainty" ↔ "Comfortable with risk") and optional end-marks.
 */

export interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  'aria-label': string
  /** Left label for bipolar scales. */
  lowLabel?: string
  /** Right label for bipolar scales. */
  highLabel?: string
  disabled?: boolean
  className?: string
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 10,
  step = 1,
  lowLabel,
  highLabel,
  disabled,
  className,
  ...props
}: SliderProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <SliderPrimitive.Root
        value={[value]}
        onValueChange={(values) => onChange(values[0] ?? value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={cn(
          'relative flex h-5 w-full touch-none items-center select-none',
          disabled && 'opacity-50',
        )}
        {...props}
      >
        <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-line">
          <SliderPrimitive.Range className="absolute h-full rounded-full bg-accent" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className={cn(
            'block size-4 cursor-grab rounded-full border-2 border-accent bg-raised shadow-sm',
            'transition-transform duration-150 ease-out hover:scale-110 active:scale-95 active:cursor-grabbing',
          )}
        />
      </SliderPrimitive.Root>
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-[11px] text-faint" aria-hidden="true">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  )
}
