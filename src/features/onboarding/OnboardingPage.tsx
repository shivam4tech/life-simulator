import type { ComponentType } from 'react'
import { Progress, Button } from '@/components/ui'
import { useOnboardingStore } from '@/app/store/onboarding'
import type { OnboardingStepId } from '@/app/store/onboarding'
import { StepYou, StepWhere, StepEducation } from './steps/core'
import { StepWork, StepMoney, StepHousehold, StepRelationships } from './steps/life'
import { StepHealth, StepBehaviour, StepGoals, StepConstraints } from './steps/personal'
import { StepReview } from './steps/review'
import { cn } from '@/utils/cn'

interface ChapterDef {
  id: OnboardingStepId
  title: string
  why: string
  Component: ComponentType
}

const CHAPTERS: readonly ChapterDef[] = [
  { id: 'you', title: 'You', why: 'The age the simulation starts from — everything else hangs off it.', Component: StepYou },
  { id: 'where', title: 'Where you live', why: 'Country, currency and settlement shape every simulated price and probability.', Component: StepWhere },
  { id: 'education', title: 'Education', why: 'Qualifications open and close career paths in the simulation.', Component: StepEducation },
  { id: 'work', title: 'Work', why: 'Occupation, income and stability drive the financial trajectories.', Component: StepWork },
  { id: 'money', title: 'Money', why: 'Savings, debt and costs decide your resilience to shocks.', Component: StepMoney },
  { id: 'household', title: 'Household', why: 'Who you live with and support changes what you can afford and risk.', Component: StepHousehold },
  { id: 'relationships', title: 'Relationships', why: 'Preferences here steer family paths — or leave them out entirely.', Component: StepRelationships },
  { id: 'health', title: 'Health', why: 'Self-assessed inputs that shape energy, costs and risks over time.', Component: StepHealth },
  { id: 'behaviour', title: 'Behaviour', why: 'Tendencies like risk tolerance alter probabilities — no position is judged.', Component: StepBehaviour },
  { id: 'goals', title: 'Goals', why: 'Weights for comparing futures. They never control what happens.', Component: StepGoals },
  { id: 'constraints', title: 'Constraints', why: 'Real limits the simulator must respect.', Component: StepConstraints },
  { id: 'review', title: 'Review', why: 'Your starting state, validated before it becomes a life.', Component: StepReview },
]

export function OnboardingPage() {
  const stepIndex = useOnboardingStore((state) => state.stepIndex)
  const setStep = useOnboardingStore((state) => state.setStep)
  const chapter = CHAPTERS[stepIndex] ?? CHAPTERS[0]!
  const isReview = chapter.id === 'review'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
      <header className="mb-6">
        <p className="text-[11px] font-medium tracking-[0.2em] text-accent-strong uppercase">
          Build your present
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-fg">
          Chapter {stepIndex + 1} of {CHAPTERS.length} · {chapter.title}
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <Progress value={(stepIndex + 1) / CHAPTERS.length} className="max-w-xs flex-1" aria-label="Onboarding progress" />
          <span className="text-[11px] text-faint tnum">
            {Math.round(((stepIndex + 1) / CHAPTERS.length) * 100)}%
          </span>
        </div>
      </header>

      {/* Mobile chapter chips */}
      <nav aria-label="Onboarding chapters" className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {CHAPTERS.map((entry, index) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setStep(index)}
            aria-current={index === stepIndex ? 'step' : undefined}
            className={cn(
              'shrink-0 rounded-md border px-2.5 py-1 text-[11px] whitespace-nowrap transition-colors',
              index === stepIndex
                ? 'border-accent bg-accent-soft font-medium text-fg'
                : index < stepIndex
                  ? 'border-line text-muted hover:text-fg'
                  : 'border-dashed border-line text-faint hover:text-fg',
            )}
          >
            {index < stepIndex ? '✓ ' : `${String(index + 1).padStart(2, '0')} `}
            {entry.title}
          </button>
        ))}
      </nav>

      <div className="grid gap-8 lg:grid-cols-[210px_1fr]">
        {/* Desktop chapter rail */}
        <nav aria-label="Onboarding chapters" className="hidden lg:block">
          <ol className="sticky top-4 flex flex-col gap-0.5">
            {CHAPTERS.map((entry, index) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setStep(index)}
                  aria-current={index === stepIndex ? 'step' : undefined}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors duration-150',
                    index === stepIndex
                      ? 'bg-accent-soft font-medium text-fg'
                      : index < stepIndex
                        ? 'text-muted hover:bg-raised hover:text-fg'
                        : 'text-faint hover:bg-raised hover:text-fg',
                  )}
                >
                  <span className="tnum w-5 shrink-0 text-[10px]">{String(index + 1).padStart(2, '0')}</span>
                  <span className="truncate">{entry.title}</span>
                  {index < stepIndex && <span className="ml-auto text-[10px] text-accent">✓</span>}
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main>
          {!isReview && (
            <div className="mb-6">
              <h2 className="font-display text-lg font-semibold text-fg">{chapter.title}</h2>
              <p className="mt-0.5 text-xs text-pretty text-muted">{chapter.why}</p>
            </div>
          )}
          <chapter.Component key={chapter.id} />
          {!isReview && (
            <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
              <Button variant="ghost" onClick={() => setStep(stepIndex - 1)} disabled={stepIndex === 0}>
                ← Back
              </Button>
              <Button variant="primary" onClick={() => setStep(stepIndex + 1)}>
                Continue →
              </Button>
            </div>
          )}
          <p className="mt-6 text-[11px] text-faint">
            Progress saves automatically in this browser. Skip anything you'd rather not answer.
          </p>
        </main>
      </div>
    </div>
  )
}
