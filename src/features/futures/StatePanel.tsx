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
              ? `${RELATIONSHIP_LABELS[snapshot.relationship] ?? '—'} · ${snapshot.childrenCount} child${snapshot.childrenCount > 1 ? 'ren' : ''}`
              : (RELATIONSHIP_LABELS[snapshot.relationship] ?? '—')
          }
        />
        <Metric
          label="Annual expenses"
          size="sm"
          value={formatCurrencyValue(snapshot.realExpenses, currency, locale, { compact: true, decimals: 0 })}
          hint="household, today’s money"
        />
        <Metric
          label="Disposable (household)"
          size="sm"
          value={formatCurrencyValue(snapshot.disposableReal, currency, locale, { compact: true, decimals: 0 })}
          hint="per year, today’s money"
        />
        <Metric
          label="Local income position"
          size="sm"
          value={`${Math.round(snapshot.incomePercentile * 100)}th pct`}
        />
        <Metric
          label="Housing burden"
          size="sm"
          value={`${Math.round(snapshot.housingBurden * 100)}%`}
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

      <HouseholdComposition result={result} snapshotIndex={snapshotIndex} locale={locale} currency={currency} />
    </div>
  )
}

/** Household block — who shares the home, who earns, what it adds up to. */
function HouseholdComposition({
  result,
  snapshotIndex,
  locale,
  currency,
}: {
  result: SimulationResult
  snapshotIndex: number
  locale?: string
  currency: string
}) {
  const snapshot = result.snapshots[snapshotIndex]
  if (!snapshot) return null
  const members: { label: string; age: number | null; note?: string }[] = [
    { label: 'You', age: snapshot.age },
  ]
  if (snapshot.household.partnerAge !== null) {
    members.push({
      label: 'Partner',
      age: snapshot.household.partnerAge,
      note: snapshot.partnerMonthlyIncome > 0 ? 'earning' : 'not earning',
    })
  }
  for (const age of snapshot.household.childAges.slice(0, 5)) {
    members.push({ label: 'Child', age })
  }
  if (snapshot.household.childAges.length > 5) {
    members.push({ label: `+${snapshot.household.childAges.length - 5} more children`, age: null })
  }
  const rendered = members.length
  const others = snapshot.householdSize - rendered
  if (others > 0) {
    members.push({ label: `${others} other household member${others === 1 ? '' : 's'}`, age: null })
  }

  const combinedMonthly = snapshot.nominalIncome / 12 + snapshot.partnerMonthlyIncome

  return (
    <section aria-label="Household composition" className="border-t border-line pt-3">
      <p className="mb-2 text-[10px] font-semibold tracking-widest text-faint uppercase">
        Household · {snapshot.householdSize} {snapshot.householdSize === 1 ? 'person' : 'people'}
      </p>
      <ul className="mb-3 flex flex-col gap-1">
        {members.map((member, index) => (
          <li key={`${member.label}-${index}`} className="flex items-baseline justify-between text-xs">
            <span className="text-muted">{member.label}</span>
            <span className="tnum text-fg">
              {member.age !== null ? member.age : ''}
              {member.note && <span className="ml-2 text-[10px] text-faint">{member.note}</span>}
            </span>
          </li>
        ))}
        {snapshot.careLevel > 0 && (
          <li className="flex items-baseline justify-between text-xs">
            <span className="text-muted">Family care duties</span>
            <span className="text-fg">{snapshot.careLevel === 2 ? 'substantial' : 'regular'}</span>
          </li>
        )}
      </ul>
      <div className="flex items-baseline justify-between gap-3 border-t border-line pt-2 text-xs">
        <span className="text-faint">
          {snapshot.incomeEarners} income earner{snapshot.incomeEarners === 1 ? '' : 's'}
        </span>
        <span className="tnum text-fg">
          {formatCurrencyValue(combinedMonthly, currency, locale, { compact: true, decimals: 0 })} / month combined
        </span>
      </div>
    </section>
  )
}
