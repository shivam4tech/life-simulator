import { useMemo, useRef } from 'react'
import type { AggregateMetricKey, YearAggregate } from '@/simulation'

/**
 * ComparisonChart — baseline vs scenario percentile bands overlaid.
 * Baseline renders in muted greys; the scenario in the accent colour.
 * Hover scrubs; the selected year shows both medians.
 */

const WIDTH = 960
const HEIGHT = 260
const PAD = { top: 14, right: 16, bottom: 26, left: 46 }

export interface ComparisonChartProps {
  baseline: YearAggregate[]
  scenario: YearAggregate[]
  metric: AggregateMetricKey
  selectedYearIndex: number
  onScrub: (yearIndex: number) => void
  scenarioLabel: string
  ariaLabel: string
}

const yLabel = (metric: AggregateMetricKey, value: number): string => {
  if (metric === 'goalAlignment') return `${Math.round(value * 100)}%`
  if (metric === 'runwayMonths') return `${Math.round(value)}mo`
  if (metric === 'healthIndex') return `${Math.round(value)}`
  if (Math.abs(value) >= 10000) return `${(value / 1000).toFixed(0)}k`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`
  return value.toFixed(0)
}

export function ComparisonChart({
  baseline,
  scenario,
  metric,
  selectedYearIndex,
  onScrub,
  ariaLabel,
}: ComparisonChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const chart = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const years = Math.min(baseline.length, scenario.length)

    let min = Infinity
    let max = -Infinity
    const collect = (aggs: YearAggregate[]) => {
      for (const agg of aggs) {
        min = Math.min(min, agg.metrics[metric]?.p10 ?? 0, agg.metrics[metric]?.p50 ?? 0)
        max = Math.max(max, agg.metrics[metric]?.p90 ?? 0, agg.metrics[metric]?.p50 ?? 0)
      }
    }
    collect(baseline)
    collect(scenario)
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

    const x = (t: number): number => PAD.left + (years <= 1 ? innerW / 2 : (t / (years - 1)) * innerW)
    const y = (v: number): number => PAD.top + innerH - ((v - min) / (max - min)) * innerH

    const bandPath = (aggs: YearAggregate[]): string => {
      let d = ''
      for (let t = 0; t < years; t++) {
        const hi = aggs[t]?.metrics[metric]?.p90
        if (hi === undefined) continue
        d += `${d === '' ? 'M' : 'L'}${x(t).toFixed(1)},${y(hi).toFixed(1)}`
      }
      for (let t = years - 1; t >= 0; t--) {
        const lo = aggs[t]?.metrics[metric]?.p10
        if (lo === undefined) continue
        d += `L${x(t).toFixed(1)},${y(lo).toFixed(1)}`
      }
      return `${d}Z`
    }

    const medianPath = (aggs: YearAggregate[]): string => {
      let d = ''
      for (let t = 0; t < years; t++) {
        const v = aggs[t]?.metrics[metric]?.p50
        if (v === undefined) continue
        d += `${d === '' ? 'M' : 'L'}${x(t).toFixed(1)},${y(v).toFixed(1)}`
      }
      return d
    }

    const tickEvery = years <= 12 ? 2 : years <= 24 ? 5 : 10
    const ticks = Array.from({ length: years }, (_, t) => t)
      .filter((t) => t % tickEvery === 0 || t === years - 1)
      .map((t) => ({ x: x(t), age: baseline[t]?.age ?? scenario[t]?.age ?? t }))

    return {
      x,
      y,
      min,
      max,
      baseBand: bandPath(baseline),
      scenarioBand: bandPath(scenario),
      baseMedian: medianPath(baseline),
      scenarioMedian: medianPath(scenario),
      ticks,
      years,
    }
  }, [baseline, scenario, metric])

  const scrubFromEvent = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const fraction =
      (clientX - rect.left - (PAD.left / WIDTH) * rect.width) /
      ((1 - (PAD.left + PAD.right) / WIDTH) * rect.width)
    const t = Math.round(fraction * (chart.years - 1))
    onScrub(Math.max(0, Math.min(chart.years - 1, t)))
  }

  const markerX = chart.x(selectedYearIndex)
  const baseMedianValue = baseline[selectedYearIndex]?.metrics[metric]?.p50
  const scenarioMedianValue = scenario[selectedYearIndex]?.metrics[metric]?.p50

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={chart.years - 1}
      aria-valuenow={selectedYearIndex}
      tabIndex={0}
      className="w-full cursor-crosshair select-none"
      onMouseMove={(event) => {
        if (event.buttons === 1) scrubFromEvent(event.clientX)
      }}
      onMouseDown={(event) => scrubFromEvent(event.clientX)}
      onTouchStart={(event) => scrubFromEvent(event.touches[0]?.clientX ?? 0)}
      onTouchMove={(event) => scrubFromEvent(event.touches[0]?.clientX ?? 0)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') onScrub(Math.max(0, selectedYearIndex - 1))
        if (event.key === 'ArrowRight') onScrub(Math.min(chart.years - 1, selectedYearIndex + 1))
      }}
    >
      <path d={chart.baseBand} fill="var(--line)" style={{ opacity: 0.4 }} />
      <path d={chart.baseMedian} fill="none" stroke="var(--fg-faint)" strokeWidth={1.5} strokeDasharray="5 5" />
      <path d={chart.scenarioBand} fill="var(--accent-soft)" />
      <path d={chart.scenarioMedian} fill="none" stroke="var(--accent)" strokeWidth={2} />

      {chart.ticks.map((tick) => (
        <g key={tick.age}>
          <line x1={tick.x} y1={PAD.top} x2={tick.x} y2={HEIGHT - PAD.bottom} stroke="var(--line)" strokeWidth={0.5} style={{ opacity: 0.5 }} />
          <text x={tick.x} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="var(--fg-faint)">
            {tick.age}
          </text>
        </g>
      ))}
      {[0, 0.5, 1].map((fraction) => {
        const value = chart.max - fraction * (chart.max - chart.min)
        return (
          <text key={fraction} x={PAD.left - 6} y={chart.y(value) + 3} textAnchor="end" fontSize={10} fill="var(--fg-faint)">
            {yLabel(metric, value)}
          </text>
        )
      })}

      <line x1={markerX} y1={PAD.top} x2={markerX} y2={HEIGHT - PAD.bottom} stroke="var(--fg)" strokeWidth={1} style={{ opacity: 0.35 }} />
      {baseMedianValue !== undefined && (
        <circle cx={markerX} cy={chart.y(baseMedianValue)} r={3.5} fill="var(--fg-faint)" />
      )}
      {scenarioMedianValue !== undefined && (
        <circle cx={markerX} cy={chart.y(scenarioMedianValue)} r={4.5} fill="var(--accent)" stroke="var(--bg)" strokeWidth={1.5} />
      )}
    </svg>
  )
}
