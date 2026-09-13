import { useMemo, useRef } from 'react'
import type { AggregateMetricKey, OutcomeBand, SimulationResult, YearAggregate } from '@/simulation'

/**
 * TrajectoryChart — "many futures begin together and diverge".
 *
 * SVG percentile bands (P10–P90 shaded, P25–P75 darker, P50 dashed) from the
 * aggregate, plus the four representative lives as thin lines with the
 * selected one highlighted. Hover/drag scrubs the selected age. No per-life
 * DOM nodes: two band paths + five lines total.
 */

const WIDTH = 960
const HEIGHT = 280
const PAD = { top: 14, right: 16, bottom: 26, left: 46 }

const BAND_COLORS: Record<OutcomeBand, string> = {
  difficult: 'var(--chart-world)',
  typical: 'var(--accent)',
  good: 'var(--chart-money)',
  exceptional: 'var(--chart-family)',
}

export interface TrajectoryChartProps {
  aggregates: YearAggregate[]
  representative: { band: OutcomeBand; result: SimulationResult }[]
  selectedBand: OutcomeBand
  metric: AggregateMetricKey
  selectedYearIndex: number
  onScrub: (yearIndex: number) => void
  locale?: string
  ariaLabel: string
}

const yLabel = (metric: AggregateMetricKey, value: number): string => {
  if (metric === 'goalAlignment') return `${Math.round(value * 100)}%`
  if (metric === 'runwayMonths') return `${Math.round(value)}mo`
  if (metric === 'healthIndex') return `${Math.round(value)}`
  if (metric === 'childrenCount') return `${Math.round(value)}`
  if (Math.abs(value) >= 10000) return `${(value / 1000).toFixed(0)}k`
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`
  return value.toFixed(0)
}

export function TrajectoryChart({
  aggregates,
  representative,
  selectedBand,
  metric,
  selectedYearIndex,
  onScrub,
  ariaLabel,
}: TrajectoryChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  const { scale, bandPath90, bandPath75, p50Path, lines, ticks } = useMemo(() => {
    const innerW = WIDTH - PAD.left - PAD.right
    const innerH = HEIGHT - PAD.top - PAD.bottom
    const years = aggregates.length

    let min = Infinity
    let max = -Infinity
    for (const agg of aggregates) {
      min = Math.min(min, agg.metrics[metric]?.p10 ?? 0, agg.metrics[metric]?.p50 ?? 0)
      max = Math.max(max, agg.metrics[metric]?.p90 ?? 0, agg.metrics[metric]?.p50 ?? 0)
    }
    for (const { result } of representative) {
      for (const snapshot of result.snapshots) {
        const value = snapshot[metric as keyof typeof snapshot]
        if (typeof value === 'number' && Number.isFinite(value)) {
          min = Math.min(min, value)
          max = Math.max(max, value)
        }
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
    const pad = (max - min) * 0.08
    min -= pad
    max += pad

    const x = (t: number): number => PAD.left + (years <= 1 ? innerW / 2 : (t / (years - 1)) * innerW)
    const y = (v: number): number => PAD.top + innerH - ((v - min) / (max - min)) * innerH

    const pathFromValues = (values: (number | undefined)[]): string => {
      let d = ''
      let started = false
      values.forEach((value, t) => {
        if (value === undefined || !Number.isFinite(value)) return
        d += `${started ? 'L' : 'M'}${x(t).toFixed(1)},${y(value).toFixed(1)}`
        started = true
      })
      return d
    }

    const bandPath = (loKey: 'p10' | 'p25', hiKey: 'p75' | 'p90'): string => {
      let d = ''
      aggregates.forEach((agg, t) => {
        const hi = agg.metrics[metric]?.[hiKey]
        const lo = agg.metrics[metric]?.[loKey]
        if (hi === undefined || lo === undefined) return
        d += `${d === '' ? 'M' : 'L'}${x(t).toFixed(1)},${y(hi).toFixed(1)}`
      })
      for (let t = aggregates.length - 1; t >= 0; t--) {
        const agg = aggregates[t]
        const lo = agg?.metrics[metric]?.[loKey]
        if (lo === undefined) continue
        d += `L${x(t).toFixed(1)},${y(lo).toFixed(1)}`
      }
      return `${d}Z`
    }

    const lines = representative.map(({ band, result }) => ({
      band,
      color: BAND_COLORS[band],
      selected: band === selectedBand,
      d: pathFromValues(result.snapshots.map((snapshot) => snapshot[metric as keyof typeof snapshot] as number)),
    }))

    const tickEvery = years <= 12 ? 2 : years <= 24 ? 5 : 10
    const ticks = Array.from({ length: years }, (_, t) => t)
      .filter((t) => t % tickEvery === 0 || t === years - 1)
      .map((t) => ({ x: x(t), age: aggregates[t]?.age ?? t, year: aggregates[t]?.year ?? t }))

    return {
      scale: { x, y, min, max },
      bandPath90: bandPath('p10', 'p90'),
      bandPath75: bandPath('p25', 'p75'),
      p50Path: pathFromValues(aggregates.map((agg) => agg.metrics[metric]?.p50)),
      lines,
      ticks,
    }
  }, [aggregates, representative, metric, selectedBand])

  const scrubFromEvent = (clientX: number) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const fraction = (clientX - rect.left - (PAD.left / WIDTH) * rect.width) / ((1 - (PAD.left + PAD.right) / WIDTH) * rect.width)
    const t = Math.round(fraction * (aggregates.length - 1))
    onScrub(Math.max(0, Math.min(aggregates.length - 1, t)))
  }

  const selectedAgg = aggregates[selectedYearIndex]
  const markerX = scale.x(selectedYearIndex)
  const selectedValue = selectedAgg?.metrics[metric]?.p50
  const repSnapshot = representative.find((r) => r.band === selectedBand)?.result.snapshots[selectedYearIndex]
  const repValue = repSnapshot ? (repSnapshot[metric as keyof typeof repSnapshot] as number) : undefined

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={aggregates.length - 1}
      aria-valuenow={selectedYearIndex}
      aria-valuetext={`Age ${selectedAgg?.age ?? selectedYearIndex}`}
      tabIndex={0}
      className="w-full cursor-crosshair select-none"
      onMouseMove={(event) => {
        if (event.buttons === 1) scrubFromEvent(event.clientX)
      }}
      onMouseDown={(event) => scrubFromEvent(event.clientX)}
      onTouchMove={(event) => scrubFromEvent(event.touches[0]?.clientX ?? 0)}
      onTouchStart={(event) => scrubFromEvent(event.touches[0]?.clientX ?? 0)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') onScrub(Math.max(0, selectedYearIndex - 1))
        if (event.key === 'ArrowRight') onScrub(Math.min(aggregates.length - 1, selectedYearIndex + 1))
      }}
    >
      {/* percentile bands */}
      <path d={bandPath90} fill="var(--accent-soft)" stroke="none" />
      <path d={bandPath75} fill="var(--accent-soft)" stroke="none" style={{ opacity: 0.75 }} />
      <path d={p50Path} fill="none" stroke="var(--accent)" strokeWidth={1.25} strokeDasharray="5 5" style={{ opacity: 0.7 }} />

      {/* grid + age ticks */}
      {ticks.map((tick) => (
        <g key={tick.age}>
          <line x1={tick.x} y1={PAD.top} x2={tick.x} y2={HEIGHT - PAD.bottom} stroke="var(--line)" strokeWidth={0.5} style={{ opacity: 0.5 }} />
          <text x={tick.x} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="var(--fg-faint)">
            {tick.age}
          </text>
        </g>
      ))}
      {/* y-axis labels */}
      {[0, 0.5, 1].map((fraction) => {
        const value = scale.max - fraction * (scale.max - scale.min)
        const yPos = scale.y(value)
        return (
          <text key={fraction} x={PAD.left - 6} y={yPos + 3} textAnchor="end" fontSize={10} fill="var(--fg-faint)">
            {yLabel(metric, value)}
          </text>
        )
      })}

      {/* representative lives */}
      {lines.map((line) => (
        <path
          key={line.band}
          d={line.d}
          fill="none"
          stroke={line.color}
          strokeWidth={line.selected ? 2.25 : 1}
          style={{ opacity: line.selected ? 1 : 0.55 }}
        />
      ))}

      {/* selected-age marker */}
      <line x1={markerX} y1={PAD.top} x2={markerX} y2={HEIGHT - PAD.bottom} stroke="var(--fg)" strokeWidth={1} style={{ opacity: 0.35 }} />
      {repValue !== undefined && (
        <circle cx={markerX} cy={scale.y(repValue)} r={4.5} fill={BAND_COLORS[selectedBand]} stroke="var(--bg)" strokeWidth={1.5} />
      )}
      {selectedValue !== undefined && (
        <text x={markerX + 6} y={PAD.top + 12} fontSize={10} fill="var(--fg-muted)">
          age {selectedAgg?.age}
        </text>
      )}
    </svg>
  )
}
