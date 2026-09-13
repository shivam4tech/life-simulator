import { useMemo, useState } from 'react'
import { Section } from '@/features/shared/Section'
import { Button, InlineNotice, SegmentedControl } from '@/components/ui'
import { formatCompactNumber, formatCurrencyValue } from '@/utils/format'
import {
  compareRuns,
  recommendDestinations,
  runMultiBranchComparison,
  type AggregateMetricKey,
  type DestinationCard,
  type DestinationPriorities,
} from '@/simulation'

const BRANCH_COLORS = ['var(--accent)', 'var(--chart-money)', 'var(--chart-family)', 'var(--chart-career)']

export const PRIORITY_LABELS: Record<keyof DestinationPriorities, string> = {
  career: 'Career opportunity',
  savings: 'Savings potential',
  family: 'Family & services',
  stability: 'Stability',
  adventure: 'Adventure & novelty',
}

/* --------------------------- destination cards --------------------------- */

export interface DestinationCardsProps {
  cards: ReturnType<typeof recommendDestinations>
  onSimulate: (code: string, name: string) => void
  isSelected: (code: string) => boolean
  onToggleSelect: (code: string) => void
}

export function DestinationCards({ cards, onSimulate, isSelected, onToggleSelect }: DestinationCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {cards.map((card: DestinationCard) => (
        <div
          key={card.code}
          className={
            isSelected(card.code)
              ? 'flex flex-col gap-2 rounded-lg border border-accent bg-accent-soft p-4'
              : 'flex flex-col gap-2 rounded-lg border border-line p-4'
          }
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-display text-sm font-semibold text-fg">{card.name}</p>
            <span className="text-[10px] text-faint tnum">{card.currency}</span>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <dt className="text-faint">Career fit</dt>
            <dd className="text-right text-fg">{card.careerFit}</dd>
            <dt className="text-faint">Migration friction</dt>
            <dd className="text-right text-fg">{card.migrationFriction}</dd>
            <dt className="text-faint">Language gap</dt>
            <dd className="text-right text-fg">{card.languageGap}</dd>
            <dt className="text-faint">Financial upside</dt>
            <dd className="text-right text-fg">{card.financialUpside}</dd>
            <dt className="text-faint">Family impact</dt>
            <dd className="text-right text-fg">{card.familyImpact}</dd>
            <dt className="text-faint">Stability</dt>
            <dd className="text-right text-fg">{card.stabilityBand}</dd>
          </dl>
          <details className="text-[11px] text-muted">
            <summary className="cursor-pointer text-accent-strong">Why it appears / main frictions</summary>
            <ul className="mt-1 flex list-disc flex-col gap-0.5 pl-4">
              {card.why.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
              {card.frictions.map((friction, index) => (
                <li key={`f-${index}`}>{friction}</li>
              ))}
            </ul>
          </details>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onSimulate(card.code, card.name)}>
              Simulate this move
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onToggleSelect(card.code)}>
              {isSelected(card.code) ? '✓ In comparison' : 'Add to comparison'}
            </Button>
          </div>
          <p className="text-[10px] text-faint">Model confidence: {card.confidence} — assumptions, not ratings.</p>
        </div>
      ))}
    </div>
  )
}

/* ------------------------ country comparison results --------------------- */

export interface CountryComparisonResultsProps {
  comparison: NonNullable<ReturnType<typeof runMultiBranchComparison>>
  locale?: string
  currency: string
  onBack: () => void
}

export function CountryComparisonResults({ comparison, locale, currency, onBack }: CountryComparisonResultsProps) {
  const [metric, setMetric] = useState<AggregateMetricKey>('realNetWorth')
  const [selectedYearIndex, setSelectedYearIndex] = useState(
    Math.max(0, comparison.baseline.aggregates.length - 1),
  )
  const years = Math.min(comparison.baseline.aggregates.length, ...comparison.branches.map((b) => b.aggregate.aggregates.length))
  const lastYear = comparison.baseline.aggregates[years - 1]

  const medians = useMemo(
    () => ({
      base: comparison.baseline.aggregates.slice(0, years).map((agg) => agg.metrics[metric]?.p50 ?? 0),
      branches: comparison.branches.map((branch) => ({
        name: branch.name,
        values: branch.aggregate.aggregates.slice(0, years).map((agg) => agg.metrics[metric]?.p50 ?? 0),
      })),
    }),
    [comparison, metric, years],
  )

  const fmt = (value: number | undefined): string =>
    value === undefined ? '—' : formatCurrencyValue(value, currency, locale, { compact: true, decimals: 0 })

  return (
    <div className="flex flex-col gap-2">
      <header>
        <p className="font-display text-lg font-semibold text-fg">Stay vs moving</p>
        <p className="mt-1 text-[11px] text-faint tnum">
          {comparison.baseline.numLives.toLocaleString()} paired lives per branch · seed{' '}
          {String(comparison.baseline.config.seed)} · {(comparison.elapsedMs / 1000).toFixed(1)}s
        </p>
      </header>

      <Section title="Median paths" className="mt-4">
        <SegmentedControl
          aria-label="Comparison metric"
          options={[
            { value: 'realNetWorth', label: 'Net worth' },
            { value: 'realIncome', label: 'Income' },
            { value: 'runwayMonths', label: 'Runway' },
            { value: 'goalAlignment', label: 'Alignment' },
          ]}
          value={metric}
          onChange={setMetric}
          size="sm"
        />
        <div className="mt-3">
          <MultiLineChart
            base={medians.base}
            branches={medians.branches}
            selectedYearIndex={Math.min(selectedYearIndex, years - 1)}
            onScrub={setSelectedYearIndex}
            ariaLabel="Country comparison median paths"
          />
        </div>
        <p className="mt-2 text-[11px] text-faint">
          Age {lastYear?.age ?? '—'} medians — stay: {fmt(medians.base[years - 1])}
          {medians.branches.map((branch) => `, ${branch.name}: ${fmt(branch.values[years - 1])}`)}.
        </p>
      </Section>

      <Section title="Where each move lands at the horizon" className="mt-6">
        <div className="flex flex-col gap-4">
          {comparison.branches.map((branch) => {
            const analysis = compareRuns(comparison.baseline, branch.aggregate, branch.paired)
            return (
              <div key={branch.name} className="rounded-lg border border-line p-4">
                <p className="font-display text-sm font-semibold text-fg">{branch.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-pretty text-muted">{analysis.tradeoffSummary}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px] sm:grid-cols-4">
                  {analysis.deltas.slice(0, 4).map((delta) => (
                    <div key={delta.key}>
                      <span className="text-faint">{delta.label}: </span>
                      <span
                        className={
                          delta.tone === 'up' ? 'text-success' : delta.tone === 'down' ? 'text-danger' : 'text-faint'
                        }
                      >
                        {delta.tone === 'flat'
                          ? '≈'
                          : `${delta.tone === 'up' ? '+' : '−'}${Math.round(Math.abs(delta.deltaPct ?? 0) * 100)}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <InlineNotice tone="info" className="mt-4">
          Migration events carry purchasing-power conversions: historical amounts stay denominated in
          the currency of their year. Moves also reshape partner careers, remittances and integration
          in these models.
        </InlineNotice>
      </Section>

      <div className="mt-2">
        <Button variant="secondary" onClick={onBack}>
          Adjust destinations
        </Button>
      </div>
    </div>
  )
}

/** Minimal multi-line median chart for country comparisons. */
export function MultiLineChart({
  base,
  branches,
  selectedYearIndex,
  onScrub,
  ariaLabel,
}: {
  base: number[]
  branches: { name: string; values: number[] }[]
  selectedYearIndex: number
  onScrub: (t: number) => void
  ariaLabel: string
}) {
  const W = 960
  const H = 240
  const PAD = { top: 12, right: 14, bottom: 24, left: 46 }
  const years = base.length
  let min = Infinity
  let max = -Infinity
  for (const v of base) {
    min = Math.min(min, v)
    max = Math.max(max, v)
  }
  for (const b of branches) {
    for (const v of b.values) {
      min = Math.min(min, v)
      max = Math.max(max, v)
    }
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    min = 0
    max = 1
  }
  if (min === max) {
    min -= 1
    max += 1
  }
  const pad = (max - min) * 0.1
  min -= pad
  max += pad
  const x = (t: number): number => PAD.left + (years <= 1 ? 1 : (t / (years - 1)) * (W - PAD.left - PAD.right))
  const y = (v: number): number =>
    PAD.top + (H - PAD.top - PAD.bottom) - ((v - min) / (max - min)) * (H - PAD.top - PAD.bottom)
  const path = (values: number[]): string =>
    values.map((v, t) => `${t === 0 ? 'M' : 'L'}${x(t).toFixed(1)},${y(v).toFixed(1)}`).join('')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ariaLabel}
      className="w-full cursor-crosshair select-none"
      onMouseDown={(event) => {
        const rect = (event.currentTarget as SVGSVGElement).getBoundingClientRect()
        const fraction =
          (event.clientX - rect.left - (PAD.left / W) * rect.width) /
          ((1 - (PAD.left + PAD.right) / W) * rect.width)
        onScrub(Math.max(0, Math.min(years - 1, Math.round(fraction * (years - 1)))))
      }}
    >
      <path d={path(base)} fill="none" stroke="var(--fg-faint)" strokeWidth={1.5} strokeDasharray="5 5" />
      {branches.map((branch, index) => (
        <path
          key={branch.name}
          d={path(branch.values)}
          fill="none"
          stroke={BRANCH_COLORS[(index + 1) % BRANCH_COLORS.length]!}
          strokeWidth={2}
        />
      ))}
      <line
        x1={x(selectedYearIndex)}
        y1={PAD.top}
        x2={x(selectedYearIndex)}
        y2={H - PAD.bottom}
        stroke="var(--fg)"
        strokeWidth={1}
        style={{ opacity: 0.3 }}
      />
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

