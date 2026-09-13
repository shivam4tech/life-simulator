import { useEffect, useMemo, useState } from 'react'
import {
  deriveLifeDrivers,
  derivePressures,
  SIMULATION_ENGINE_VERSION,
  type AggregateMetricKey,
  type EventDomain,
  type MonteCarloRun,
  type OutcomeBand,
  type SimEvent,
} from '@/simulation'
import { getCountryProfile } from '@/data/countries'
import { Button, SegmentedControl, Sheet, Slider } from '@/components/ui'
import { Section } from '@/features/shared/Section'
import { useProfileStore } from '@/app/store/profile'
import { TrajectoryChart } from './TrajectoryChart'
import { LifeTimeline, TIMELINE_DOMAINS } from './LifeTimeline'
import { EventInspectorContent } from './EventInspector'
import { StatePanel } from './StatePanel'
import { LifeDrivers } from './LifeDrivers'
import { DimensionRails } from './DimensionRails'
import { cn } from '@/utils/cn'

const BAND_LABELS: Record<OutcomeBand, string> = {
  difficult: 'Difficult',
  typical: 'Typical',
  good: 'Good',
  exceptional: 'Exceptional',
}

const CHART_METRICS: readonly { value: AggregateMetricKey; label: string }[] = [
  { value: 'realIncome', label: 'Income' },
  { value: 'realNetWorth', label: 'Net worth' },
  { value: 'runwayMonths', label: 'Runway' },
  { value: 'goalAlignment', label: 'Alignment' },
]

export interface FuturesOverviewProps {
  run: MonteCarloRun
  onRerun: () => void
}

export function FuturesOverview({ run, onRerun }: FuturesOverviewProps) {
  const profile = useProfileStore((state) => state.profile)
  const country = profile ? getCountryProfile(profile.demographics.countryOfResidence) : undefined
  const locale = country?.identity.locale
  const currency = country?.identity.currency ?? ''

  const [selectedBand, setSelectedBand] = useState<OutcomeBand>('typical')
  const [selectedYearIndex, setSelectedYearIndex] = useState<number>(run.aggregates.length - 1)
  const [metric, setMetric] = useState<AggregateMetricKey>('realNetWorth')
  const [domainFilter, setDomainFilter] = useState<EventDomain | 'all'>('all')
  const [inspectedEvent, setInspectedEvent] = useState<SimEvent | null>(null)
  const [playing, setPlaying] = useState(false)

  const selected = run.representative.find((entry) => entry.band === selectedBand) ?? run.representative[0]
  const years = run.aggregates.length

  // Playback: step through the selected life; stop at the end.
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setSelectedYearIndex((current) => {
        if (current >= years - 1) {
          setPlaying(false)
          return current
        }
        return current + 1
      })
    }, 450)
    return () => window.clearInterval(timer)
  }, [playing, years])

  const switchBand = (band: OutcomeBand) => {
    setSelectedBand(band)
    setPlaying(false)
    setSelectedYearIndex(years - 1)
  }

  const drivers = useMemo(() => (selected ? deriveLifeDrivers(selected.result) : []), [selected])
  const pressures = useMemo(
    () => (selected ? derivePressures(selected.result, selectedYearIndex) : []),
    [selected, selectedYearIndex],
  )

  const seedLabel = selected?.result.seed.toString(36) ?? ''

  return (
    <div className="flex flex-col gap-2">
      {/* ------------------------------ header ------------------------------ */}
      <header className="pt-2">
        <p className="font-display text-lg font-semibold text-fg">
          {run.numLives.toLocaleString()} futures generated
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-faint tnum">
          <span>world: {run.config.worldScenario}</span>
          <span>seed: {String(run.config.seed)}</span>
          <span>horizon: {run.config.horizonYears}y</span>
          <span>engine: {SIMULATION_ENGINE_VERSION}</span>
          <span>{(run.elapsedMs / 1000).toFixed(1)}s</span>
        </div>
      </header>

      {/* ------------------------------ bands ------------------------------ */}
      <section aria-label="Outcome bands" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {run.bands.map((band) => (
          <button
            key={band.band}
            type="button"
            onClick={() => switchBand(band.band)}
            aria-pressed={selectedBand === band.band}
            className={cn(
              'cursor-pointer border-t-2 pt-2 text-left transition-colors duration-150',
              selectedBand === band.band
                ? 'border-accent'
                : 'border-line hover:border-line-strong',
            )}
          >
            <p
              className={cn(
                'text-[11px] font-semibold tracking-wide uppercase',
                selectedBand === band.band ? 'text-fg' : 'text-faint',
              )}
            >
              {BAND_LABELS[band.band]}
            </p>
            <p className="tnum font-display text-2xl font-semibold text-fg">
              {Math.round(band.share * 100)}%
            </p>
          </button>
        ))}
      </section>
      <p className="text-[11px] text-faint">
        Bands group the simulated lives by how well they matched your weighted goals — bottom fifth,
        middle 60%, next 15%, top 5% of this universe. Click a band to open its representative life.
      </p>

      {/* ------------------------ dimension rails -------------------------- */}
      <Section
        title={`Outcome dimensions at age ${run.aggregates[run.aggregates.length - 1]?.age ?? '—'}`}
        className="mt-6"
      >
        <DimensionRails aggregate={run.aggregates[run.aggregates.length - 1]!} locale={locale} currency={currency} />
      </Section>

      {/* --------------------------- explorer ------------------------------ */}
      <Section title="Explore the representative lives" className="mt-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              aria-label="Representative life"
              options={run.representative.map(({ band }) => ({
                value: band,
                label: BAND_LABELS[band],
              }))}
              value={selectedBand}
              onChange={(band) => switchBand(band)}
              size="sm"
            />
            <SegmentedControl
              aria-label="Chart metric"
              options={CHART_METRICS.map((entry) => ({ value: entry.value, label: entry.label }))}
              value={metric}
              onChange={setMetric}
              size="sm"
            />
          </div>

          {selected && (
            <TrajectoryChart
              aggregates={run.aggregates}
              representative={run.representative}
              selectedBand={selectedBand}
              metric={metric}
              selectedYearIndex={selectedYearIndex}
              onScrub={(index) => {
                setPlaying(false)
                setSelectedYearIndex(index)
              }}
              ariaLabel={`Trajectories by ${metric}; scrub to an age`}
            />
          )}

          {/* age scrubber + playback */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Button size="sm" variant="ghost" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause playback' : 'Play this life'}>
                {playing ? '⏸' : '▶'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Previous year"
                onClick={() => {
                  setPlaying(false)
                  setSelectedYearIndex((current) => Math.max(0, current - 1))
                }}
              >
                ◀
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Next year"
                onClick={() => {
                  setPlaying(false)
                  setSelectedYearIndex((current) => Math.min(years - 1, current + 1))
                }}
              >
                ▶
              </Button>
              <Slider
                aria-label="Age scrubber"
                value={selectedYearIndex}
                onChange={(index) => {
                  setPlaying(false)
                  setSelectedYearIndex(index)
                }}
                min={0}
                max={years - 1}
                className="flex-1"
              />
              <span className="w-20 text-right text-xs text-muted tnum">
                age {selected?.result.snapshots[selectedYearIndex]?.age ?? '—'}
              </span>
            </div>
          </div>

          {/* domain filters */}
          <div className="flex flex-wrap gap-2">
            {TIMELINE_DOMAINS.map((domain) => (
              <button
                key={domain.id}
                type="button"
                onClick={() => setDomainFilter(domain.id)}
                aria-pressed={domainFilter === domain.id}
                className={cn(
                  'cursor-pointer rounded-md border px-2.5 py-1 text-[11px] transition-colors duration-150',
                  domainFilter === domain.id
                    ? 'border-accent bg-accent-soft font-medium text-fg'
                    : 'border-line text-muted hover:border-line-strong hover:text-fg',
                )}
              >
                {domain.label}
              </button>
            ))}
          </div>

          {/* the life timeline */}
          {selected && (
            <LifeTimeline
              result={selected.result}
              domainFilter={domainFilter}
              selectedYearIndex={selectedYearIndex}
              onSelectYear={(index) => {
                setPlaying(false)
                setSelectedYearIndex(index)
              }}
              onSelectEvent={setInspectedEvent}
            />
          )}
          <p className="text-[11px] text-faint">
            Drag the chart or scrubber to move through the life; click an event chip to inspect it.
          </p>
        </div>
      </Section>

      {/* --------------------- state + why + assumptions -------------------- */}
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <Section title="This life, right now">
          {selected && (
            <StatePanel
              result={selected.result}
              snapshotIndex={selectedYearIndex}
              pressures={pressures}
              locale={locale}
              currency={currency}
            />
          )}
        </Section>

        <div className="flex flex-col gap-8">
          <Section title="Why did this life happen?">
            <LifeDrivers drivers={drivers} />
          </Section>

          <Section title="Universe & assumptions">
            <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1.5 text-xs">
              <dt className="text-faint">Profile</dt>
              <dd className="text-fg">{profile?.displayName ?? 'Your life'}</dd>
              <dt className="text-faint">World</dt>
              <dd className="text-fg capitalize">{run.config.worldScenario} conditions</dd>
              <dt className="text-faint">Seed</dt>
              <dd className="text-fg tnum">{String(run.config.seed)}</dd>
              <dt className="text-faint">Country model</dt>
              <dd className="text-fg">
                {country?.provenance.source} · {country?.provenance.confidence}
              </dd>
              <dt className="text-faint">Engine</dt>
              <dd className="text-fg tnum">{SIMULATION_ENGINE_VERSION}</dd>
            </dl>
            <p className="mt-3 text-[11px] leading-relaxed text-faint">
              In this simulated universe, these are modelled trajectories under these assumptions —
              not predictions and not financial, medical, legal or immigration advice.
            </p>
          </Section>
        </div>
      </div>

      {/* --------------------------- inspector ------------------------------ */}
      <Sheet
        open={inspectedEvent !== null}
        onOpenChange={(open) => {
          if (!open) setInspectedEvent(null)
        }}
        title="Event inspector"
        description={selected ? `Seed ${seedLabel} · replayable in this universe` : undefined}
      >
        <EventInspectorContent
          event={inspectedEvent}
          result={selected?.result ?? run.representative[0]!.result}
          locale={locale}
          currency={currency}
        />
      </Sheet>

      <div className="mt-2">
        <Button variant="secondary" onClick={onRerun}>
          Adjust universe & re-run
        </Button>
      </div>
    </div>
  )
}
