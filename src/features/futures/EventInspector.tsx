import type { SimEvent, SimulationResult } from '@/simulation'
import { currencyLabel } from '@/utils/format'

/**
 * EventInspector — click an event, see what the engine actually did:
 * context, the engine's own causes, and snapshot deltas around the event year.
 * Deltas are derived from consecutive year snapshots, never invented.
 */

export interface EventInspectorProps {
  event: SimEvent | null
  result: SimulationResult
  locale?: string
  currency: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const pct = (delta: number): string => {
  if (!Number.isFinite(delta)) return '—'
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${Math.round(delta * 100)}%`
}

export function EventInspectorContent({ event, result, locale, currency }: Omit<EventInspectorProps, 'open' | 'onOpenChange'>) {
  if (!event) return null

  const yearIndex = result.snapshots.findIndex((snapshot) => snapshot.year === event.year)
  const snapshot = yearIndex >= 0 ? result.snapshots[yearIndex] : undefined
  const previous = yearIndex > 0 ? result.snapshots[yearIndex - 1] : undefined

  const deltaIncome =
    previous && snapshot && previous.realIncome > 0
      ? snapshot.realIncome / previous.realIncome - 1
      : undefined
  const deltaNetWorth =
    previous && snapshot ? snapshot.realNetWorth - previous.realNetWorth : undefined
  const deltaRunway = previous && snapshot ? snapshot.runwayMonths - previous.runwayMonths : undefined

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-sm font-semibold text-fg">{event.title}</p>
          <span className="text-[11px] text-faint tnum">
            age {event.age} · {event.year}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-pretty text-muted">{event.description}</p>
      </div>

      <section aria-label="Why this occurred">
        <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-faint uppercase">Why this occurred (model factors)</p>
        <ul className="flex flex-col gap-1">
          {event.causes.map((cause, index) => (
            <li
              key={index}
              className={
                cause.startsWith('+')
                  ? 'text-xs text-success'
                  : cause.startsWith('-')
                    ? 'text-xs text-danger'
                    : 'text-xs text-muted'
              }
            >
              {cause}
            </li>
          ))}
        </ul>
      </section>

      {snapshot && (
        <section aria-label="Immediate consequences">
          <p className="mb-1.5 text-[10px] font-semibold tracking-widest text-faint uppercase">
            That year vs the year before ({currencyLabel(currency)})
          </p>
          <dl className="grid grid-cols-3 gap-3">
            <div>
              <dt className="text-[10px] text-faint uppercase">Real income</dt>
              <dd className="text-xs text-fg tnum">
                {deltaIncome !== undefined ? pct(deltaIncome) : 'first year'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-faint uppercase">Net worth</dt>
              <dd className="text-xs text-fg tnum">
                {deltaNetWorth !== undefined
                  ? `${deltaNetWorth >= 0 ? '+' : '−'}${Math.abs(deltaNetWorth).toLocaleString(locale, { notation: 'compact', maximumFractionDigits: 1 })}`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] text-faint uppercase">Runway</dt>
              <dd className="text-xs text-fg tnum">
                {deltaRunway !== undefined
                  ? `${deltaRunway >= 0 ? '+' : '−'}${Math.abs(deltaRunway).toFixed(1)} mo`
                  : '—'}
              </dd>
            </div>
          </dl>
          <p className="mt-2 text-[10px] text-faint">
            These are measured differences between the year snapshots around the event — other
            factors in the same year can contribute.
          </p>
        </section>
      )}
    </div>
  )
}
