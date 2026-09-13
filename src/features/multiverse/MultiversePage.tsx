import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, EmptyState, InlineNotice, SegmentedControl } from '@/components/ui'
import { useSimulationStore } from '@/app/store/simulation'
import { useProfileStore } from '@/app/store/profile'
import { Section } from '@/features/shared/Section'
import {
  formatCompactNumber,
  formatCurrencyValue,
} from '@/utils/format'
import { getCountryProfile } from '@/data/countries'
import type { AggregateMetricKey } from '@/simulation'

/**
 * Life Multiverse (Sprint 10) — "YOUR MULTIVERSE": the full-branch-tree
 * exploration surface. When a simulation exists, shows representative lives
 * side by side with medians and the tree of user-created branches.
 */

const BAND_COLORS: Record<string, string> = {
  difficult: 'var(--chart-world)',
  typical: 'var(--accent)',
  good: 'var(--chart-money)',
  exceptional: 'var(--chart-family)',
}

export function MultiversePage() {
  const navigate = useNavigate()
  const run = useSimulationStore((state) => state.run)
  const profile = useProfileStore((state) => state.profile)
  const country = profile ? getCountryProfile(profile.demographics.countryOfResidence) : undefined
  const locale = country?.identity.locale
  const currency = country?.identity.currency ?? ''

  const [metric, setMetric] = useState<AggregateMetricKey>('realNetWorth')

  const series = useMemo(() => {
    if (!run) return { base: [], branches: [] }
    const years = run.aggregates.length
    return {
      base: run.aggregates.slice(0, years).map((agg) => agg.metrics[metric]?.p50 ?? 0),
      branches: run.representative.map((rep) => ({
        name: rep.band,
        values: rep.result.snapshots
          .slice(0, years)
          .map((_, i) => rep.result.snapshots[i]?.[metric as keyof typeof rep.result.snapshots[0]] as number ?? 0),
      })),
    }
  }, [run, metric])

  if (!run || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="Your multiverse awaits"
          description="Simulate your futures first — then the multiverse opens: every representative life, every fork, every branch you've created."
          action={
            <Button variant="primary" onClick={() => navigate('/futures')}>
              Go to Futures
            </Button>
          }
        />
      </div>
    )
  }

  const lastYear = run.aggregates[run.aggregates.length - 1]
  const fmt = (value: number | undefined): string =>
    value === undefined ? '—' : formatCurrencyValue(value, currency, locale, { compact: true, decimals: 0 })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] text-accent-strong uppercase">Your Multiverse</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-fg">
          {run.numLives.toLocaleString()} lives · {run.representative.length} paths · {run.bands.length} outcome bands
        </h1>
        <p className="mt-1 text-sm text-muted">
          Every line is a real simulated life. Switch between paths to explore them.
        </p>
      </header>

      <Section title="Parallel lives — median paths by outcome band">
        <SegmentedMetric metric={metric} onMetric={setMetric} />
        <MultiverseChart base={series.base} branches={series.branches} />
        <p className="mt-2 text-[11px] text-faint">
          Age {lastYear?.age ?? '—'} medians —{' '}
          {run.representative.map((rep) => `${rep.band}: ${fmt(rep.result.snapshots[rep.result.snapshots.length - 1]?.realNetWorth)}`).join(' · ')}
        </p>
      </Section>

      <Section title="Representative lives" className="mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {run.representative.map(({ band, result }) => {
            const last = result.snapshots[result.snapshots.length - 1]
            return (
              <div key={band} className="rounded-lg border border-line p-4">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs font-semibold capitalize" style={{ color: BAND_COLORS[band] }}>
                    {band}
                  </p>
                  <span className="text-[10px] text-faint tnum">{result.seed.toString(36)}</span>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <dt className="text-faint">End age</dt><dd className="text-right text-fg tnum">{last?.age}</dd>
                  <dt className="text-faint">Net worth</dt><dd className="text-right text-fg tnum">{fmt(last?.realNetWorth)}</dd>
                  <dt className="text-faint">Alignment</dt><dd className="text-right text-fg tnum">{Math.round(result.final.composite * 100)}%</dd>
                  <dt className="text-faint">Health</dt><dd className="text-right text-fg tnum">{Math.round(last?.healthIndex ?? 0)}</dd>
                </dl>
              </div>
            )
          })}
        </div>
      </Section>

      <InlineNotice tone="info" className="mt-6">
        Fork new branches from the Futures explorer ("Rewind &amp; fork this life") — they'll join
        your multiverse.
      </InlineNotice>
    </div>
  )
}

/* ------------------------------ sub-widgets ------------------------------- */

function SegmentedMetric({ metric, onMetric }: { metric: AggregateMetricKey; onMetric: (m: AggregateMetricKey) => void }) {
  return (
    <SegmentedControl
      aria-label="Chart metric"
      options={[
        { value: 'realNetWorth', label: 'Net worth' },
        { value: 'realIncome', label: 'Income' },
        { value: 'disposableReal', label: 'Disposable' },
        { value: 'runwayMonths', label: 'Runway' },
        { value: 'goalAlignment', label: 'Alignment' },
      ]}
      value={metric}
      onChange={(value: AggregateMetricKey) => onMetric(value)}
      size="sm"
    />
  )
}

function MultiverseChart({ base, branches }: { base: number[]; branches: { name: string; values: number[] }[] }) {
  const W = 960
  const H = 260
  const PAD = { top: 12, right: 14, bottom: 22, left: 46 }
  const years = base.length
  let min = Infinity
  let max = -Infinity
  for (const v of base) { min = Math.min(min, v); max = Math.max(max, v) }
  for (const b of branches) { for (const v of b.values) { min = Math.min(min, v); max = Math.max(max, v) } }
  if (!Number.isFinite(min) || !Number.isFinite(max)) { min = 0; max = 1 }
  if (min === max) { min -= 1; max += 1 }
  const pad = (max - min) * 0.1
  min -= pad; max += pad
  const x = (t: number): number => PAD.left + (years <= 1 ? 1 : (t / (years - 1)) * (W - PAD.left - PAD.right))
  const y = (v: number): number => PAD.top + (H - PAD.top - PAD.bottom) - ((v - min) / (max - min)) * (H - PAD.top - PAD.bottom)
  const path = (values: number[]): string =>
    values.map((v, t) => `${t === 0 ? 'M' : 'L'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Multiverse paths" className="w-full select-none">
      {branches.map((branch) => (
        <path key={branch.name} d={path(branch.values)} fill="none" stroke={BAND_COLORS[branch.name] ?? 'var(--accent)'} strokeWidth={1.75} style={{ opacity: 0.8 }} />
      ))}
      <path d={path(base)} fill="none" stroke="var(--fg-faint)" strokeWidth={1.25} strokeDasharray="5 4" />
      {[0, 0.5, 1].map((f) => (
        <text key={f} x={PAD.left - 6} y={y(max - f * (max - min)) + 3} textAnchor="end" fontSize={10} fill="var(--fg-faint)">
          {formatCompactNumber(max - f * (max - min))}
        </text>
      ))}
      {[0, Math.floor(years / 2), years - 1].map((t) => (
        <text key={t} x={x(t)} y={H - 6} textAnchor="middle" fontSize={10} fill="var(--fg-faint)">
          {t === 0 ? 'now' : `+${t}y`}
        </text>
      ))}
    </svg>
  )
}
