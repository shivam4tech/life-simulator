import { useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

/** Deterministic tiny PRNG for stable visuals (presentation-only, not business logic). */
const mulberry32 = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const readColor = (name: string, fallback: string): string => {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

interface PathSpec {
  /** Vertical drift per segment, plus a branch point where the path splits. */
  drifts: number[]
  branchAt: number | null
  color: string
  width: number
}

/**
 * TrajectoryCanvas — the landing glimpse of possible lives.
 * Many thin seeded trajectories flow from a shared origin and diverge.
 * Looping animation pauses when off-screen and renders static under
 * prefers-reduced-motion.
 */
export function TrajectoryCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const palette = [
      readColor('--chart-career', '#4fb8c9'),
      readColor('--chart-money', '#4fae87'),
      readColor('--chart-relationships', '#c96a6a'),
      readColor('--chart-family', '#9a7fd1'),
      readColor('--chart-location', '#6d8fd1'),
    ]

    let interval = 0
    let running = true
    let paths: PathSpec[] = []
    let width = 0
    let height = 0

    const buildPaths = () => {
      const rand = mulberry32(20260913)
      const count = width < 640 ? 42 : 78
      paths = Array.from({ length: count }, () => {
        const segments = 7
        const drifts = Array.from({ length: segments }, () => (rand() - 0.5) * 2)
        return {
          drifts,
          branchAt: rand() < 0.55 ? Math.floor(rand() * (segments - 2)) + 1 : null,
          color: palette[Math.floor(rand() * palette.length)] ?? palette[0]!,
          width: 0.6 + rand() * 0.9,
        }
      })
    }

    const drawPath = (path: PathSpec, originY: number, progress: number, alpha: number) => {
      const segments = path.drifts.length
      const segWidth = width / segments
      ctx.beginPath()
      ctx.moveTo(0, originY)
      let y = originY
      const endSegment = Math.min(segments, Math.ceil(progress * segments))
      for (let i = 0; i < endSegment; i++) {
        const drift = path.drifts[i] ?? 0
        const nextY = originY + (i + 1) * drift * (height * 0.09)
        ctx.bezierCurveTo(
          segWidth * (i + 0.33),
          y,
          segWidth * (i + 0.66),
          nextY,
          segWidth * (i + 1),
          nextY,
        )
        y = nextY
        if (path.branchAt === i) {
          // Ghost continuation — the path that could also have been.
          ctx.save()
          ctx.globalAlpha *= 0.35
          ctx.setLineDash([2, 4])
          ctx.beginPath()
          ctx.moveTo(segWidth * (i + 1), y)
          ctx.bezierCurveTo(
            segWidth * (i + 1.5),
            y + (drift > 0 ? -1 : 1) * height * 0.05,
            segWidth * (i + 2),
            y + (drift > 0 ? -1 : 1) * height * 0.09,
            width,
            y + (drift > 0 ? -1 : 1) * height * 0.12,
          )
          ctx.stroke()
          ctx.restore()
          ctx.beginPath()
          ctx.moveTo(segWidth * (i + 1), y)
        }
      }
      ctx.strokeStyle = path.color
      ctx.globalAlpha = alpha
      ctx.lineWidth = path.width
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const render = (progress: number) => {
      ctx.clearRect(0, 0, width, height)
      const originY = height * 0.72
      for (const path of paths) drawPath(path, originY, progress, 0.5)
      // Shared origin node.
      ctx.beginPath()
      ctx.arc(0, originY, 3, 0, Math.PI * 2)
      ctx.fillStyle = readColor('--fg', '#e8ecf3')
      ctx.globalAlpha = 0.9
      ctx.fill()
      ctx.globalAlpha = 1
    }

    const resize = () => {
      // Decorative canvas: cap resolution well below devicePixelRatio — the
      // savings keep the main thread free for real interaction.
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      buildPaths()
      if (reducedMotion) render(1)
    }

    resize()
    window.addEventListener('resize', resize)

    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      // Static render: reduced motion or an environment without observers (tests).
      render(1)
      return () => window.removeEventListener('resize', resize)
    }

    const observer = new IntersectionObserver(([entry]) => {
      running = entry?.isIntersecting ?? false
      if (running) {
        // Ambient art at 10fps: interval-paced draws keep the main thread
        // almost entirely free (no per-frame rAF churn).
        const start = performance.now()
        const duration = 9000
        let lastBucket = -1
        interval = window.setInterval(() => {
          const now = performance.now()
          const progress = (Math.sin(((now - start) / duration) * Math.PI * 2 - Math.PI / 2) + 1) / 2
          const bucket = Math.round(progress * 30)
          if (bucket !== lastBucket) {
            lastBucket = bucket
            render(bucket / 30)
          }
        }, 100)
      } else {
        window.clearInterval(interval)
      }
    })
    observer.observe(canvas)

    return () => {
      running = false
      window.clearInterval(interval)
      observer.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={cn('block', className)} />
}
