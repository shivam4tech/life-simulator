import { useEffect, useMemo, useRef } from 'react'
import type { EventDomain, SimulationResult, SimEvent } from '@/simulation'
import { cn } from '@/utils/cn'

/**
 * LifeTimeline — the horizontal event rail of one representative life.
 * Years are fixed-width cells so domain filters never cause layout chaos;
 * busy years collapse their minor events behind a "+n" chip.
 */

export const TIMELINE_DOMAINS: readonly { id: EventDomain | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'career', label: 'Career' },
  { id: 'money', label: 'Money' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'family', label: 'Family' },
  { id: 'health', label: 'Health' },
  { id: 'education', label: 'Education' },
  { id: 'world', label: 'Shocks' },
]

const DOMAIN_COLORS: Partial<Record<EventDomain, string>> = {
  career: 'var(--chart-career)',
  money: 'var(--chart-money)',
  relationships: 'var(--chart-relationships)',
  family: 'var(--chart-family)',
  health: 'var(--chart-health)',
  education: 'var(--chart-education)',
  world: 'var(--chart-world)',
}

export interface LifeTimelineProps {
  result: SimulationResult
  domainFilter: EventDomain | 'all'
  selectedYearIndex: number
  onSelectYear: (yearIndex: number) => void
  onSelectEvent: (event: SimEvent) => void
}

export function LifeTimeline({
  result,
  domainFilter,
  selectedYearIndex,
  onSelectYear,
  onSelectEvent,
}: LifeTimelineProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const eventsByYear = useMemo(() => {
    const map = new Map<number, SimEvent[]>()
    for (const event of result.events) {
      if (domainFilter !== 'all' && event.domain !== domainFilter) continue
      const yearIndex = event.year - (result.snapshots[0]?.year ?? event.year)
      const list = map.get(yearIndex) ?? []
      list.push(event)
      map.set(yearIndex, list)
    }
    return map
  }, [result, domainFilter])

  // Keep the selected year visible when scrubbing/playing.
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    const cell = container.querySelector<HTMLElement>(`[data-year-index="${selectedYearIndex}"]`)
    if (!cell) return
    const target = cell.offsetLeft - container.clientWidth / 2 + cell.clientWidth / 2
    container.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [selectedYearIndex])

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="overflow-x-auto pb-2"
        role="listbox"
        aria-label="Life events by year"
      >
        <div className="flex min-w-max items-stretch gap-0 px-6">
          {result.snapshots.map((snapshot, yearIndex) => {
            const events = eventsByYear.get(yearIndex) ?? []
            const isStart = yearIndex === 0
            return (
              <button
                key={snapshot.year}
                data-year-index={yearIndex}
                type="button"
                onClick={() => onSelectYear(yearIndex)}
                aria-selected={yearIndex === selectedYearIndex}
                className={cn(
                  'relative flex w-[74px] shrink-0 cursor-pointer flex-col items-center border-l border-line pt-2 pb-1 transition-colors duration-150',
                  yearIndex === selectedYearIndex ? 'bg-accent-soft' : 'hover:bg-raised',
                )}
              >
                {/* rail node */}
                <span
                  className={cn(
                    'absolute left-[-4.5px] top-[13px] size-[9px] rounded-full border-2',
                    yearIndex === selectedYearIndex ? 'border-accent bg-accent' : 'border-line-strong bg-surface',
                  )}
                  aria-hidden="true"
                />
                <span className="tnum text-[10px] text-faint">
                  {isStart ? `age ${snapshot.age}` : snapshot.age}
                </span>
                <span className="tnum mb-1 text-[9px] text-faint" style={{ opacity: 0.6 }}>
                  {snapshot.year}
                </span>
                <div className="flex w-full flex-col items-center gap-1 px-1">
                  {events.slice(0, 2).map((event) => (
                    <span
                      key={event.id}
                      role="option"
                      aria-selected="false"
                      title={`${event.title} — click to inspect`}
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation()
                        onSelectYear(yearIndex)
                        onSelectEvent(event)
                      }}
                      onKeyDown={(keyboardEvent) => {
                        if (keyboardEvent.key === 'Enter') {
                          keyboardEvent.stopPropagation()
                          onSelectYear(yearIndex)
                          onSelectEvent(event)
                        }
                      }}
                      tabIndex={0}
                      className={cn(
                        'w-full truncate rounded-sm px-1 py-0.5 text-left text-[9px] leading-tight',
                        event.severity === 'major' ? 'font-medium' : 'text-muted',
                      )}
                      style={{
                        backgroundColor: `color-mix(in oklab, ${DOMAIN_COLORS[event.domain] ?? 'var(--line)'} 16%, transparent)`,
                        color: 'var(--fg-muted)',
                        borderLeft: `2px solid ${DOMAIN_COLORS[event.domain] ?? 'var(--line)'}`,
                      }}
                    >
                      {event.title}
                    </span>
                  ))}
                  {events.length > 2 && (
                    <span className="text-[9px] text-faint tnum">+{events.length - 2} more</span>
                  )}
                  {events.length === 0 && (
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: 'var(--line)' }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
