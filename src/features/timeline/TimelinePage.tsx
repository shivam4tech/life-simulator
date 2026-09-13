import { useNavigate } from 'react-router'
import { Button, EmptyState } from '@/components/ui'
import { useSimulationStore } from '@/app/store/simulation'
import { useProfileStore } from '@/app/store/profile'
import { getCountryProfile } from '@/data/countries'
import { Section } from '@/features/shared/Section'
import { FuturesOverview } from '@/features/futures/FuturesOverview'

/**
 * Timeline — the explorable life timeline of the most recent universe.
 * The heavy state lives in the in-memory simulation store; running a fresh
 * universe takes one click from here.
 */
export function TimelinePage() {
  const navigate = useNavigate()
  const run = useSimulationStore((state) => state.run)
  const profile = useProfileStore((state) => state.profile)
  const country = profile ? getCountryProfile(profile.demographics.countryOfResidence) : undefined

  if (!run) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <EmptyState
          title="No universe to explore yet"
          description="Run a simulation first — the timeline, event inspector and age scrubber open on its representative lives."
          action={
            <Button variant="primary" onClick={() => navigate('/futures')}>
              Go to Futures
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      <header className="mb-4">
        <p className="text-[11px] font-medium tracking-[0.2em] text-accent-strong uppercase">Timeline</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-fg">
          {run.numLives.toLocaleString()} possible lives · exploring representative ones
        </h1>
      </header>
      <Section title="Life explorer">
        <FuturesOverview run={run} onRerun={() => navigate('/futures')} />
      </Section>
      <p className="mt-6 text-[11px] text-faint">
        Currency context: {country?.identity.currency ?? '—'} · {country?.identity.name ?? 'unknown country'}
      </p>
    </div>
  )
}
