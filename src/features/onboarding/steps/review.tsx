import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, Field, InlineNotice, TextInput } from '@/components/ui'
import { useOnboardingStore, ONBOARDING_STEP_IDS } from '@/app/store/onboarding'
import { hasBlockingIssues, validateProfile } from '@/domain/validation'
import { ProfileSummary } from '@/features/profile/ProfileSummary'
import { usePatch, useDraft } from './core'

/* -------------------------------- 12 · Review ---------------------------- */

export function StepReview() {
  const draft = useDraft()
  const patch = usePatch()
  const navigate = useNavigate()
  const complete = useOnboardingStore((state) => state.complete)
  const setStep = useOnboardingStore((state) => state.setStep)
  const reset = useOnboardingStore((state) => state.reset)
  const [confirmReset, setConfirmReset] = useState(false)

  const issues = useMemo(() => validateProfile(draft), [draft])
  const blocking = issues.filter((issue) => issue.severity === 'error')
  const nonBlocking = issues.filter((issue) => issue.severity !== 'error')
  const filledChapters = useMemo(
    () =>
      new Set(
        Object.entries(sectionFieldCounts(draft))
          .filter(([, count]) => count > 0)
          .map(([id]) => id),
      ),
    [draft],
  )

  const save = () => {
    complete()
    navigate('/my-life')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Field
          label="Name this life (optional)"
          description="A label for your save slots — “My real life”, “The experiment”…"
          render={(aria) => (
            <TextInput
              {...aria}
              value={draft.displayName ?? ''}
              onChange={(event) =>
                patch((d) => ({ ...d, displayName: event.target.value || undefined }))
              }
              placeholder="Your starting state"
            />
          )}
        />
      </div>

      {blocking.length > 0 && (
        <InlineNotice tone="danger" title="Fix these before saving">
          <ul className="list-disc pl-4">
            {blocking.map((issue) => (
              <li key={issue.id}>
                {issue.message}{' '}
                {issue.stepId && (
                  <button
                    type="button"
                    className="cursor-pointer underline underline-offset-2"
                    onClick={() =>
                      setStep(ONBOARDING_STEP_IDS.indexOf(issue.stepId as (typeof ONBOARDING_STEP_IDS)[number]))
                    }
                  >
                    Fix in {issue.stepId}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </InlineNotice>
      )}

      {nonBlocking.length > 0 && (
        <InlineNotice tone="warning" title="Worth a look — nothing here blocks saving">
          <ul className="list-disc pl-4">
            {nonBlocking.map((issue) => (
              <li key={issue.id}>
                {issue.message}{' '}
                {issue.stepId && (
                  <button
                    type="button"
                    className="cursor-pointer underline underline-offset-2"
                    onClick={() =>
                      setStep(ONBOARDING_STEP_IDS.indexOf(issue.stepId as (typeof ONBOARDING_STEP_IDS)[number]))
                    }
                  >
                    Review in {issue.stepId}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </InlineNotice>
      )}

      <div className="flex flex-wrap gap-2">
        {ONBOARDING_STEP_IDS.filter((id) => id !== 'review').map((id, index) => (
          <button
            key={id}
            type="button"
            onClick={() => setStep(index)}
            className={
              filledChapters.has(id)
                ? 'cursor-pointer rounded-md border border-line bg-surface px-2.5 py-1 text-[11px] text-muted transition-colors hover:border-line-strong hover:text-fg'
                : 'cursor-pointer rounded-md border border-dashed border-line px-2.5 py-1 text-[11px] text-faint transition-colors hover:border-line-strong hover:text-fg'
            }
          >
            {filledChapters.has(id) ? '✓' : '·'} {id}
          </button>
        ))}
      </div>

      <ProfileSummary profile={draft} />

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <Button variant="primary" size="lg" onClick={save} disabled={hasBlockingIssues(issues)}>
          Save this life
        </Button>
        <span className="text-[11px] text-faint">
          Simulation engines arrive in Sprint 3 — your saved state will be their input.
        </span>
        {confirmReset ? (
          <span className="ml-auto flex items-center gap-2 text-xs text-muted">
            Discard the whole draft?
            <Button size="sm" variant="danger" onClick={() => { reset(); setStep(0) }}>
              Yes, start over
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(false)}>
              Keep editing
            </Button>
          </span>
        ) : (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setConfirmReset(true)}>
            Start over
          </Button>
        )}
      </div>
    </div>
  )
}

/** Which onboarding chapters contain at least one user-entered value. */
const sectionFieldCounts = (draft: ReturnType<typeof useOnboardingStore.getState>['draft']) => ({
  you: draft.demographics.age?.kind === 'known' || draft.demographics.sex !== undefined ? 1 : 0,
  where: draft.demographics.countryOfResidence !== '' ? 1 : 0,
  education: countFields(draft.education),
  work: countFields(draft.employment),
  money: countFields(draft.finances),
  household: countFields(draft.household) + countFields(draft.dependents) + countFields(draft.housing),
  relationships: (draft.relationshipStatus !== undefined ? 1 : 0) + countFields(draft.relationshipPreferences),
  health: countFields(draft.health),
  behaviour: countFields(draft.behaviours),
  goals: countFields(draft.goals),
  constraints: countFields(draft.constraints),
})

const countFields = (section: unknown): number =>
  section && typeof section === 'object'
    ? Object.values(section).filter((value) => value !== undefined).length
    : 0
