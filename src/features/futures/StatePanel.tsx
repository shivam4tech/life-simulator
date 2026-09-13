import type { LifePressures, SimulationResult } from '@/simulation'
import { formatCurrencyValue } from '@/utils/format'
import { Metric } from '@/components/ui'
import { useEffect, useRef, useState } from 'react'

/**
 * StatePanel — the selected life's situation at the scrubbed age, with
 * gently animated numbers (disabled under prefers-reduced-motion).
 */

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Interpolate displayed numbers toward their target (~300ms). */
const useCountUp = (target: number): number => {
  const [display, setDisplay] = useState(target)
  const fromRef = useRef(target)
  const rafRef = useRef(0)

  useEffect(() => {
    if (prefersReducedMotion() || !Number.isFinite(target)) {
      setDisplay(target)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    const duration = 280
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const value = from + (target - from) * eased
      setDisplay(value)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        fromRef.current = target
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target])

  return display
}

export interface StatePanelProps {
  result: SimulationResult
  snapshotIndex: number
  pressures: LifePressures[]
  locale?: string
  currency: string
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  single: 'Single',
  dating: 'Dating',
  committed: 'Committed relationship',
  cohabiting: 'Cohabiting',
  married: 'Married / partnered',
  separated: 'Separated',
  divorced: 'Divorced',
  widowed: 'Widowed',
  other: 'Other',
}

const EMPLOYMENT_LABELS: Record<string, string> = {
  student: 'Studying',
  unemployed: 'Between jobs',
  employed: 'Employed',
  'self-employed': 'Self-employed',
  retired: 'Retired',
  informal: 'Informal work',
  gig: 'Gig / freelance',
}

export function StatePanel({ result, snapshotIndex, pressures, locale, currency }: StatePanelProps) {
  const snapshot = result.snapshots[snapshotIndex]
  if (!snapshot) return null

  const animatedIncome = useCountUp(snapshot.realIncome)
  const animatedNetWorth = useCountUp(snapshot.realNetWorth)
  const animatedRunway = useCountUp(snapshot.runwayMonths)
  const animatedHealth = useCountUp(snapshot.healthIndex)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-sm font-semibold text-fg">Age {snapshot.age}</p>
        <span className="text-[11px] text-faint tnum">{snapshot.year}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <Metric
          label="Career"
          size="sm"
          value={EMPLOYMENT_LABELS[snapshot.employment] ?? snapshot.employment}
          hint={snapshot.seniorityIndex > 0 ? `seniority ${snapshot.seniorityIndex}/6` : undefined}
        />
        <Metric label="Relationship" size="sm" value={RELATIONSHIP_LABELS[snapshot.relationship] ?? snapshot.relationship} />
        <Metric
          label="Real income / yr"
          size="sm"
          value={formatCurrencyValue(animatedIncome, currency, locale, { compact: true, decimals: 0 })}
          hint="today’s money"
        />
        <Metric
          label="Net worth"
          size="sm"
          value={formatCurrencyValue(animatedNetWorth, currency, locale, { compact: true, decimals: 0 })}
          hint="today’s money"
        />
        <Metric label="Emergency runway" size="sm" value={`${animatedRunway.toFixed(1)} mo`} />
        <Metric label="Health" size="sm" value={`${Math.round(animatedHealth)}/100`} />
        <Metric
          label="Household"
          size="sm"
          value={
            snapshot.childrenCount > 0
              ? `${RELATIONSHIP_LABELS[snapshot.relationship] ?? '—'} · ${snapshot.childrenCount} dependent${snapshot.childrenCount > 1 ? 's' : ''}`
              : (RELATIONSHIP_LABELS[snapshot.relationship] ?? '—')
          }
        />
        <Metric
          label="Annual expenses"
          size="sm"
          value={formatCurrencyValue(snapshot.realExpenses, currency, locale, { compact: true, decimals: 0 })}
          hint="household, today’s money"
        />
      </div>

      {pressures.length > 0 && (
        <section aria-label="Top active pressures" className="border-t border-line pt-3">
          <p className="mb-2 text-[10px] font-semibold tracking-widest text-faint uppercase">Top active pressures</p>
          <ul className="flex flex-col gap-1.5">
            {pressures.map((pressure) => (
              <li key={pressure.label} className="text-xs">
                <span className="font-medium text-fg">{pressure.label}</span>
                <span className="text-faint"> — {pressure.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
