import type { SimulationResult } from '@/simulation'
import { formatCurrencyValue } from '@/utils/format'
import { Metric } from '@/components/ui'

/**
 * EndOfLifeSummary — the final outcome page for a representative life.
 * "This life ended at age N. Here's what it looked like." Respectful,
 * multi-dimensional, never a single score.
 */

export interface EndOfLifeSummaryProps {
  result: SimulationResult
  locale?: string
  currency: string
}

const RELATIONSHIP_LABELS: Record<string, string> = {
  single: 'Single', dating: 'Dating', committed: 'Committed relationship',
  cohabiting: 'Cohabiting', married: 'Married / partnered', separated: 'Separated',
  divorced: 'Divorced', widowed: 'Widowed', other: 'Other',
}

export function EndOfLifeSummary({ result, locale, currency }: EndOfLifeSummaryProps) {
  const last = result.snapshots[result.snapshots.length - 1]
  if (!last) return null

  const majorEvents = result.events.filter((e) => e.severity === 'major')
  const turningPoints = majorEvents.slice(0, 5)

  const fmt = (value: number): string =>
    formatCurrencyValue(value, currency, locale, { compact: true, decimals: 0 })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        This simulated life ended at age {last.age} ({last.year}).
        {result.final.stopReason === 'age-limit' ? ' The simulation reached its age limit.' : ' It reached the horizon you set.'}
      </p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
        <Metric label="Financial position" size="sm" value={fmt(last.realNetWorth)} hint="net worth, today’s money" />
        <Metric label="Career" size="sm" value={last.employment === 'retired' ? 'Retired' : 'Ended working'} hint={last.seniorityIndex > 0 ? `seniority ${last.seniorityIndex}/6` : undefined} />
        <Metric label="Family" size="sm" value={RELATIONSHIP_LABELS[last.relationship] ?? last.relationship} hint={last.childrenCount > 0 ? `${last.childrenCount} child${last.childrenCount > 1 ? 'ren' : ''}` : undefined} />
        <Metric label="Health" size="sm" value={`${Math.round(last.healthIndex)}/100`} />
        <Metric label="Real income" size="sm" value={fmt(last.realIncome)} hint="per year, today’s money" />
        <Metric label="Emergency runway" size="sm" value={`${last.runwayMonths.toFixed(1)} mo`} />
        <Metric label="Goal alignment" size="sm" value={`${Math.round(last.goalAlignment * 100)}%`} hint="your weighted goals" />
        <Metric label="Major events" size="sm" value={majorEvents.length} />
      </div>

      {turningPoints.length > 0 && (
        <section aria-label="Major turning points" className="border-t border-line pt-3">
          <p className="mb-2 text-[10px] font-semibold tracking-widest text-faint uppercase">Major turning points</p>
          <ul className="flex flex-col gap-1">
            {turningPoints.map((event) => (
              <li key={event.id} className="text-xs">
                <span className="tnum text-faint">Age {event.age}</span>
                <span className="text-fg"> — {event.title.toLowerCase()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Final dimensions" className="border-t border-line pt-3">
        <p className="mb-2 text-[10px] font-semibold tracking-widest text-faint uppercase">Final dimensions</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] sm:grid-cols-4">
          {Object.entries(result.final.dimensions).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize text-faint">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="tnum text-fg">{Math.round(value * 100)}%</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-faint">
          In this simulated universe, under these assumptions — not a prediction, not advice.
          Explore another life, rewind, or compare.
        </p>
      </section>
    </div>
  )
}
