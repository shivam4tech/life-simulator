import type { AggregateMetricKey, YearAggregate } from '@/simulation'
import { formatCurrencyValue, formatCompactNumber } from '@/utils/format'

/**
 * DimensionRails — outcome distributions as percentile rails (P10————P90 with
 * a P50 marker). Distributions and ranges, never one giant success gauge.
 */

export interface DimensionRailsProps {
  aggregate: YearAggregate
  locale?: string
  currency: string
}

interface Rail {
  key: AggregateMetricKey
  label: string
  kind: 'money' | 'months' | 'index' | 'percent'
}

const RAILS: readonly Rail[] = [
  { key: 'realIncome', label: 'Real income / year', kind: 'money' },
  { key: 'realNetWorth', label: 'Net worth (today’s money)', kind: 'money' },
  { key: 'runwayMonths', label: 'Emergency runway', kind: 'months' },
  { key: 'healthIndex', label: 'Health', kind: 'index' },
  { key: 'goalAlignment', label: 'Your-goal alignment', kind: 'percent' },
  { key: 'childrenCount', label: 'Children', kind: 'index' },
]

const formatRailValue = (rail: Rail, value: number, locale?: string, currency?: string): string => {
  switch (rail.kind) {
    case 'money':
      return formatCurrencyValue(value, currency ?? '', locale, { compact: true, decimals: 0 })
    case 'months':
      return `${value.toFixed(1)} mo`
    case 'percent':
      return `${Math.round(value * 100)}%`
    default:
      return formatCompactNumber(value, locale)
  }
}

export function DimensionRails({ aggregate, locale, currency }: DimensionRailsProps) {
  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
      {RAILS.map((rail) => {
        const percentiles = aggregate.metrics[rail.key]
        if (!percentiles) return null
        const { p10, p50, p90 } = percentiles
        const span = Math.max(p90 - p10, Math.abs(p90) * 0.12, 1e-9)
        const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))
        // Marker position within the P10→P90 window.
        const p50Pos = clamp01((p50 - p10) / span)
        return (
          <div key={rail.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-muted">{rail.label}</span>
              <span className="text-xs text-fg tnum">
                {formatRailValue(rail, p50, locale, currency)}
                <span className="text-faint"> median</span>
              </span>
            </div>
            <div
              className="relative h-2 rounded-full"
              style={{ background: 'var(--line)' }}
              role="img"
              aria-label={`${rail.label}: P10 ${formatRailValue(rail, p10, locale, currency)}, P50 ${formatRailValue(rail, p50, locale, currency)}, P90 ${formatRailValue(rail, p90, locale, currency)}`}
            >
              {/* P10–P90 spread window */}
              <div
                className="absolute inset-y-0 rounded-full"
                style={{
                  left: '4%',
                  width: '92%',
                  background:
                    'linear-gradient(90deg, color-mix(in oklab, var(--accent) 22%, transparent), color-mix(in oklab, var(--accent) 34%, transparent))',
                }}
              />
              {/* P50 marker */}
              <div
                className="absolute top-[-3px] h-[14px] w-[3px] rounded-full bg-accent"
                style={{ left: `calc(${4 + p50Pos * 92}% - 1.5px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-faint tnum">
              <span>P10 {formatRailValue(rail, p10, locale, currency)}</span>
              <span>P90 {formatRailValue(rail, p90, locale, currency)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
