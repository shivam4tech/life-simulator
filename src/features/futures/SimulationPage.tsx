import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Button,
  EmptyState,
  InlineNotice,
  Metric,
  Progress,
  SegmentedControl,
  Skeleton,
  TextInput,
} from '@/components/ui'
import { useProfileStore } from '@/app/store/profile'
import { getCountryProfile } from '@/data/countries'
import {
  formatCompactNumber,
  formatCurrencyValue,
} from '@/utils/format'
import {
  runSimulationAsync,
  SIMULATION_ENGINE_VERSION,
  type MonteCarloRun,
  type SimulationConfig,
  type SimulationRunHandle,
  type WorldScenario,
  type AggregateMetricKey,
} from '@/simulation'
import { Section } from '@/features/shared/Section'

type Length = '5' | '10' | '20' | '30'
type Lives = '500' | '2000' | '10000'

const METRIC_LABELS: Record<AggregateMetricKey, string | null> = {
  realIncome: 'Real income / year',
  realNetWorth: 'Net worth (today’s money)',
  savings: 'Savings (nominal)',
  realExpenses: 'Household expenses / year',
  runwayMonths: 'Emergency runway (months)',
  healthIndex: 'Health index (0–100)',
  goalAlignment: 'Your-goal alignment (0–1)',
  childrenCount: null, // shown in representative cards instead
}

const randomSeed = (): string => Math.floor(Math.random() * 0xffffffff).toString(36)

export function SimulationPage() {
  const navigate = useNavigate()
  const profile = useProfileStore((state) => state.profile)

  const [horizon, setHorizon] = useState<Length>('20')
  const [scenario, setScenario] = useState<WorldScenario>('stable')
  const [lives, setLives] = useState<Lives>('2000')
  const [seed, setSeed] = useState<string>(() => randomSeed())

  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [run, setRun] = useState<MonteCarloRun | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runHandle = useRef<SimulationRunHandle | null>(null)

  const country = useMemo(
    () => (profile ? getCountryProfile(profile.demographics.countryOfResidence) : undefined),
    [profile],
  )

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="No life to simulate yet"
          description="The engine needs a starting state — build yours (or load a fictional example) first."
          action={
            <div className="flex gap-3">
              <Button variant="primary" onClick={() => navigate('/create')}>
                Create my life
              </Button>
              <Button onClick={() => navigate('/my-life')}>My Life</Button>
            </div>
          }
        />
      </div>
    )
  }

  const start = () => {
    if (!country) {
      setError('The profile’s country is not supported by the economic model.')
      return
    }
    setError(null)
    setRunning(true)
    setRun(null)
    setProgress({ completed: 0, total: Number(lives) })
    const config: SimulationConfig = {
      seed,
      worldScenario: scenario,
      horizonYears: Number(horizon),
      startCalendarYear: new Date().getFullYear(),
    }
    const handle = runSimulationAsync(profile, config, Number(lives), (completed, total) =>
      setProgress({ completed, total }),
    )
    runHandle.current = handle
    handle.promise.then((outcome) => {
      setRunning(false)
      runHandle.current = null
      if (outcome.status === 'done') {
        setRun(outcome.run)
      } else if (outcome.status === 'cancelled') {
        setRun(null)
      } else {
        setError(outcome.message)
      }
    })
  }

  const cancel = () => {
    runHandle.current?.cancel()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] text-accent-strong uppercase">Futures</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-fg">Simulate my futures</h1>
        <p className="mt-1 text-sm text-muted">
          Deterministic seeded universes: same profile, same seed, same futures — every time.
        </p>
      </header>

      <Section title="Universe settings">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Horizon</span>
            <SegmentedControl
              aria-label="Simulation horizon"
              options={[
                { value: '5', label: '5y' },
                { value: '10', label: '10y' },
                { value: '20', label: '20y' },
                { value: '30', label: '30y' },
              ]}
              value={horizon}
              onChange={setHorizon}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">World conditions</span>
            <SegmentedControl
              aria-label="World scenario"
              options={[
                { value: 'optimistic', label: 'Optimistic' },
                { value: 'stable', label: 'Stable' },
                { value: 'difficult', label: 'Difficult' },
                { value: 'volatile', label: 'Volatile' },
              ]}
              value={scenario}
              onChange={setScenario}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Lives to simulate</span>
            <SegmentedControl
              aria-label="Number of lives"
              options={[
                { value: '500', label: '500' },
                { value: '2000', label: '2,000' },
                { value: '10000', label: '10,000' },
              ]}
              value={lives}
              onChange={setLives}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Seed</span>
            <div className="flex gap-2">
              <TextInput
                aria-label="Universe seed"
                value={seed}
                onChange={(event) => setSeed(event.target.value.trim() || '0')}
                className="flex-1"
              />
              <Button onClick={() => setSeed(randomSeed())}>New</Button>
            </div>
            <p className="text-[11px] text-faint">Share this seed to replay this exact universe later.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" onClick={start} disabled={running}>
            {running ? 'Simulating…' : 'Simulate my futures'}
          </Button>
          {running && (
            <Button variant="danger" onClick={cancel}>
              Cancel
            </Button>
          )}
          <span className="text-[11px] text-faint">Engine {SIMULATION_ENGINE_VERSION} · placeholder economics</span>
        </div>
        {running && (
          <div className="mt-4 flex flex-col gap-2">
            <Progress value={progress.total > 0 ? progress.completed / progress.total : 0} aria-label="Simulation progress" />
            <p className="text-xs text-muted tnum">
              {formatCompactNumber(progress.completed)} / {formatCompactNumber(progress.total)} lives simulated
            </p>
          </div>
        )}
        {error && (
          <InlineNotice tone="danger" title="Simulation failed" className="mt-4">
            {error}
          </InlineNotice>
        )}
      </Section>

      {running && !run && (
        <Section title="Working" className="mt-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Section>
      )}

      {run && <Results run={run} locale={country?.identity.locale} currency={country?.identity.currency ?? ''} />}
    </div>
  )
}

function Results({
  run,
  locale,
  currency,
}: {
  run: MonteCarloRun
  locale: string | undefined
  currency: string
}) {
  const last = run.aggregates[run.aggregates.length - 1]
  const moneyMetrics: AggregateMetricKey[] = ['realIncome', 'realNetWorth', 'savings', 'realExpenses']
  const rowMetrics: AggregateMetricKey[] = ['realIncome', 'realNetWorth', 'runwayMonths', 'healthIndex', 'goalAlignment']

  const formatCell = (metric: AggregateMetricKey, value: number | undefined): string => {
    if (value === undefined) return '—'
    if (metric === 'runwayMonths') return `${value.toFixed(1)} mo`
    if (metric === 'healthIndex') return `${Math.round(value)}`
    if (metric === 'goalAlignment') return `${Math.round(value * 100)}%`
    if (moneyMetrics.includes(metric)) return formatCurrencyValue(value, currency, locale, { compact: true, decimals: 0 })
    return formatCompactNumber(value, locale)
  }

  return (
    <>
      <Section title={`Result · ${run.numLives.toLocaleString()} futures in ${(run.elapsedMs / 1000).toFixed(1)}s`} className="mt-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {run.bands.map((band) => (
            <div key={band.band} className="border-t-2 border-line pt-2">
              <p className="text-[11px] font-semibold tracking-wide text-faint uppercase">{band.band}</p>
              <p className="tnum font-display text-2xl font-semibold text-fg">
                {Math.round(band.share * 100)}%
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-faint">
          Bands compare lives inside this universe by your goal weights (bottom fifth, middle 60%,
          next 15%, top 5%). Not a life score — objective dimensions are below.
        </p>
      </Section>

      {last && (
        <Section title={`At age ${last.age} (${last.year})`} className="mt-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] tracking-wide text-faint uppercase">
                  <th className="py-2 pr-3 font-medium">Dimension</th>
                  <th className="py-2 pr-3 text-right font-medium tnum">P10</th>
                  <th className="py-2 pr-3 text-right font-medium tnum">P25</th>
                  <th className="py-2 pr-3 text-right font-medium tnum">P50</th>
                  <th className="py-2 pr-3 text-right font-medium tnum">P75</th>
                  <th className="py-2 text-right font-medium tnum">P90</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {rowMetrics.map((metric) => (
                  <tr key={metric} className="border-b border-line/60">
                    <td className="py-2 pr-3 text-muted">{METRIC_LABELS[metric]}</td>
                    {(['p10', 'p25', 'p50', 'p75', 'p90'] as const).map((p) => (
                      <td key={p} className="py-2 pr-3 text-right text-fg">
                        {formatCell(metric, last.metrics[metric]?.[p])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-faint">
            Nominal amounts in {currency}; income/net worth shown in today’s purchasing power.
          </p>
        </Section>
      )}

      <Section title="Representative lives — actual runs, replayable seeds" className="mt-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {run.representative.map(({ band, result }) => {
            const lastSnapshot = result.snapshots[result.snapshots.length - 1]
            const majorEvents = result.events.filter((event) => event.severity === 'major')
            return (
              <div key={band} className="rounded-lg border border-line p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-display text-sm font-semibold text-fg capitalize">{band} life</p>
                  <span className="text-[10px] text-faint tnum">seed {result.seed.toString(36)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="End age" size="sm" value={lastSnapshot?.age ?? '—'} />
                  <Metric label="Goal alignment" size="sm" value={`${Math.round(result.final.composite * 100)}%`} />
                  <Metric
                    label="Real income"
                    size="sm"
                    value={lastSnapshot ? formatCurrencyValue(lastSnapshot.realIncome, currency, locale, { compact: true, decimals: 0 }) : '—'}
                  />
                  <Metric
                    label="Net worth (today’s money)"
                    size="sm"
                    value={lastSnapshot ? formatCurrencyValue(lastSnapshot.realNetWorth, currency, locale, { compact: true, decimals: 0 }) : '—'}
                  />
                  <Metric label="Health" size="sm" value={lastSnapshot ? Math.round(lastSnapshot.healthIndex) : '—'} />
                  <Metric label="Major events" size="sm" value={majorEvents.length} />
                </div>
              </div>
            )
          })}
        </div>
        <InlineNotice tone="info" className="mt-4">
          Primitive preview on purpose: the explorable life timeline, event inspector and outcome
          bands interactive view arrive in Sprint 4.
        </InlineNotice>
      </Section>
    </>
  )
}
