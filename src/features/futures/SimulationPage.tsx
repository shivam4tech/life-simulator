import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Button,
  EmptyState,
  InlineNotice,
  Progress,
  SegmentedControl,
  TextInput,
} from '@/components/ui'
import { useProfileStore } from '@/app/store/profile'
import { useSimulationStore } from '@/app/store/simulation'
import { getCountryProfile } from '@/data/countries'
import { formatCompactNumber } from '@/utils/format'
import {
  runSimulationAsync,
  type MonteCarloRun,
  type SimulationConfig,
  type SimulationRunHandle,
  type WorldScenario,
} from '@/simulation'
import { Section } from '@/features/shared/Section'
import { FuturesOverview } from './FuturesOverview'

type Length = '5' | '10' | '20' | '30'
type Lives = '500' | '2000' | '10000'

const randomSeed = (): string => Math.floor(Math.random() * 0xffffffff).toString(36)

type Phase = 'config' | 'running' | 'results'

export function SimulationPage() {
  const navigate = useNavigate()
  const profile = useProfileStore((state) => state.profile)
  const setRunStore = useSimulationStore((state) => state.setRun)
  const storedRun = useSimulationStore((state) => state.run)

  const [phase, setPhase] = useState<Phase>('config')
  const [horizon, setHorizon] = useState<Length>('20')
  const [scenario, setScenario] = useState<WorldScenario>('stable')
  const [lives, setLives] = useState<Lives>('2000')
  const [seed, setSeed] = useState<string>(() => randomSeed())
  const [seedMode, setSeedMode] = useState<'random' | 'specific'>('random')

  const [progress, setProgress] = useState({ completed: 0, total: 0 })
  const [run, setRun] = useState<MonteCarloRun | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const runHandle = useRef<SimulationRunHandle | null>(null)

  const country = profile ? getCountryProfile(profile.demographics.countryOfResidence) : undefined

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

  const effectiveSeed = seedMode === 'random' ? seed : seed.trim() || '0'

  const start = () => {
    if (!country) {
      setError('This profile’s country is not supported by the economic model yet.')
      setPhase('config')
      return
    }
    setError(null)
    setNotice(null)
    setRun(null)
    setProgress({ completed: 0, total: Number(lives) })
    setPhase('running')
    const config: SimulationConfig = {
      seed: effectiveSeed,
      worldScenario: scenario,
      horizonYears: Number(horizon),
      startCalendarYear: new Date().getFullYear(),
    }
    const handle = runSimulationAsync(profile, config, Number(lives), (completed, total) =>
      setProgress({ completed, total }),
    )
    runHandle.current = handle
    handle.promise.then((outcome) => {
      runHandle.current = null
      if (outcome.status === 'done') {
        setRun(outcome.run)
        setRunStore(outcome.run)
        setPhase('results')
      } else if (outcome.status === 'cancelled') {
        setPhase('config')
        setNotice('Simulation cancelled — nothing was lost. Adjust and re-run whenever you like.')
      } else {
        setError(outcome.message)
        setPhase('config')
      }
    })
  }

  const cancel = () => {
    runHandle.current?.cancel()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {phase !== 'results' && (
        <header className="mb-6">
          <p className="text-[11px] font-medium tracking-[0.2em] text-accent-strong uppercase">Futures</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-fg">Simulate my futures</h1>
          <p className="mt-1 text-sm text-muted">
            Deterministic seeded universes: same profile, same seed, same futures — every time.
          </p>
        </header>
      )}

      {notice && (
        <InlineNotice tone="info" className="mb-5">
          {notice}
        </InlineNotice>
      )}
      {error && (
        <InlineNotice tone="danger" title="Simulation failed" className="mb-5">
          {error}
        </InlineNotice>
      )}

      {phase === 'config' && (
        <>
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
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Seed</span>
                  <SegmentedControl
                    aria-label="Seed mode"
                    size="sm"
                    options={[
                      { value: 'random', label: 'Random universe' },
                      { value: 'specific', label: 'Specific seed' },
                    ]}
                    value={seedMode}
                    onChange={setSeedMode}
                  />
                </div>
                {seedMode === 'random' ? (
                  <div className="flex gap-2">
                    <TextInput aria-label="Universe seed" value={seed} readOnly className="flex-1" />
                    <Button onClick={() => setSeed(randomSeed())}>New</Button>
                  </div>
                ) : (
                  <TextInput
                    aria-label="Universe seed"
                    value={seed}
                    onChange={(event) => setSeed(event.target.value.trim() || '0')}
                  />
                )}
                <p className="text-[11px] text-faint">
                  The seed stays visible after the run — share it to replay this exact universe.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="primary" size="lg" onClick={start}>
                Simulate my futures
              </Button>
              <span className="text-[11px] text-faint">
                {profile.displayName ?? 'Your life'} · {country?.identity.name} · {currencyTag(country?.identity.currency)}
              </span>
            </div>
          </Section>
          {storedRun && (
            <Section title="Last universe" className="mt-6">
              <p className="text-xs text-muted">
                A finished universe from this session is still open —{' '}
                <button
                  type="button"
                  className="cursor-pointer text-accent-strong underline underline-offset-2"
                  onClick={() => {
                    setRun(storedRun)
                    setPhase('results')
                  }}
                >
                  reopen it
                </button>
                .
              </p>
            </Section>
          )}
        </>
      )}

      {phase === 'running' && (
        <section aria-label="Simulation running" className="mx-auto max-w-md py-14 text-center">
          <p className="font-display text-base font-semibold tracking-wide text-fg uppercase">
            Simulating {Number(lives).toLocaleString()} lives
          </p>
          <p className="tnum mt-2 text-sm text-muted">
            {formatCompactNumber(progress.completed)} / {formatCompactNumber(progress.total)} completed
          </p>
          <div className="mt-4">
            <Progress
              value={progress.total > 0 ? progress.completed / progress.total : 0}
              aria-label="Simulation progress"
            />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Each simulated life runs every yearly stage — career, relationships, family, health,
            finances — before the next batch begins. This runs off the main thread; the interface
            stays responsive.
          </p>
          <Button variant="danger" className="mt-5" onClick={cancel}>
            Cancel
          </Button>
        </section>
      )}

      {phase === 'results' && run && (
        <FuturesOverview
          run={run}
          onRerun={() => {
            setPhase('config')
          }}
        />
      )}
    </div>
  )
}

const currencyTag = (currency: string | undefined): string => (currency ? `amounts in ${currency}` : '')
