import type { LifeDriver } from '@/simulation'

/**
 * LifeDrivers — "Why did this life happen?" (major model contributors).
 * Derived entirely from the run output in simulation/insights.ts.
 */

export interface LifeDriversProps {
  drivers: LifeDriver[]
}

export function LifeDrivers({ drivers }: LifeDriversProps) {
  if (drivers.length === 0) {
    return <p className="text-xs text-faint">Not enough happened in this life to name clear drivers.</p>
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-semibold tracking-widest text-faint uppercase">
        Major model contributors
      </p>
      <ol className="flex flex-col gap-3">
        {drivers.map((driver, index) => (
          <li key={driver.key} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-1 h-8 w-1 shrink-0 rounded-full"
              style={{
                backgroundColor:
                  driver.tone === 'positive'
                    ? 'var(--success)'
                    : driver.tone === 'negative'
                      ? 'var(--danger)'
                      : 'var(--warning)',
                opacity: 1 - index * 0.12,
              }}
            />
            <div>
              <p className="text-xs font-medium text-fg">{driver.label}</p>
              <ul className="mt-0.5 flex flex-col gap-0.5">
                {driver.evidence.map((evidence, evidenceIndex) => (
                  <li key={evidenceIndex} className="text-[11px] text-muted">
                    {evidence}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-[10px] text-faint">
        Ranked by how much each model system visibly moved this trajectory — a model reading, not a
        claim about fate.
      </p>
    </div>
  )
}
