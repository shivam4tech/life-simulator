import { useNavigate } from 'react-router'
import { Button, Sparkle } from '@/components/ui'
import { ExampleChooser } from '@/features/onboarding/ExampleChooser'
import { TrajectoryCanvas } from './TrajectoryCanvas'
import { generateRandomLife } from '@/simulation/random-life'
import { useProfileStore } from '@/app/store/profile'

const PRINCIPLES = [
  'Thousands of seeded futures — never one prediction.',
  'Turning points explained, uncertainty made visible.',
  'Any country, any currency, any kind of life.',
] as const

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative isolate overflow-hidden">
      <TrajectoryCanvas className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-60" />
      <div className="observatory-grid pointer-events-none absolute inset-0 -z-10" />

      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-20 pb-16 text-center md:pt-28">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-[0.2em] text-accent-strong uppercase">
          <Sparkle className="size-3.5" />
          Life Simulator
        </p>
        <h1 className="font-display text-4xl leading-[1.05] font-semibold text-balance text-fg md:text-6xl">
          Your future is not one line.
        </h1>
        <p className="mt-5 max-w-xl text-sm text-pretty text-muted md:text-base">
          Build the life you are living now. Explore the lives that could plausibly grow out of it —
          bad, typical, good, exceptional — and see what each decision changes.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" size="lg" onClick={() => navigate('/create')}>
            Create my life
          </Button>
          <ExampleChooser />
          <Button
            variant="ghost"
            size="lg"
            onClick={() => {
              const randomLife = generateRandomLife(`random-${Date.now()}`)
              useProfileStore.getState().setProfile(randomLife)
              navigate('/my-life')
            }}
          >
            Play a random life
          </Button>
        </div>
        <p className="mt-3 text-[11px] text-faint">Random lives are fictional, generated from the country registry.</p>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-16">
        <ul className="divide-y divide-line border-y border-line text-left">
          {PRINCIPLES.map((line) => (
            <li key={line} className="py-3.5 text-sm text-muted first:pt-0 last:pb-0">
              {line}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
