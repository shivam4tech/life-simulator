import { Field, InlineNotice, TextInput, Toggle } from '@/components/ui'
import { GOAL_KEYS, GOAL_LABELS, known, unknownValue } from '@/domain'
import type { GoalKey, MaybeValue } from '@/domain'
import { OptionalSlider } from '../controls'
import { useDraft, usePatch } from './core'
import { TriPills } from './life'

/* -------------------------------- 08 · Health ---------------------------- */

export function StepHealth() {
  const draft = useDraft()
  const patch = usePatch()
  const health = draft.health ?? {}
  const set = (next: Partial<typeof health>) =>
    patch((d) => ({ ...d, health: { ...d.health, ...next } }))
  const knownNum = (v: MaybeValue<number> | undefined) =>
    v && v.kind === 'known' ? v.value : undefined
  const fromSlider = (v: number | undefined): MaybeValue<number> =>
    v === undefined ? unknownValue() : known(v)

  return (
    <div className="flex flex-col gap-5">
      <InlineNotice tone="info">
        Broad self-assessments that steer the simulation — not a medical questionnaire and never a
        diagnosis.
      </InlineNotice>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <OptionalSlider
          label="Overall health"
          value={knownNum(health.overall)}
          onChange={(v) => set({ overall: fromSlider(v) })}
          min={1}
          max={5}
          lowLabel="Poor"
          highLabel="Excellent"
        />
        <OptionalSlider
          label="Physical activity"
          value={knownNum(health.activity)}
          onChange={(v) => set({ activity: fromSlider(v) })}
          lowLabel="Mostly sedentary"
          highLabel="Very active"
        />
        <OptionalSlider
          label="Sleep quality"
          value={knownNum(health.sleepQuality)}
          onChange={(v) => set({ sleepQuality: fromSlider(v) })}
          lowLabel="Poor"
          highLabel="Excellent"
        />
        <OptionalSlider
          label="Access to healthcare when needed"
          value={knownNum(health.healthcareAccess)}
          onChange={(v) => set({ healthcareAccess: fromSlider(v) })}
          lowLabel="Hard to reach"
          highLabel="Easy to reach"
        />
        <OptionalSlider
          label="Mental wellbeing (optional)"
          value={knownNum(health.mentalWellbeing)}
          onChange={(v) => set({ mentalWellbeing: fromSlider(v) })}
          lowLabel="Struggling"
          highLabel="Thriving"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <Toggle
          label="I smoke"
          checked={health.smoking ?? false}
          onChange={(smoking) => set({ smoking })}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Alcohol</span>
          <TriPills
            value={health.alcohol}
            onChange={(alcohol) => set({ alcohol })}
            options={[
              { value: 'none', label: 'None' },
              { value: 'light', label: 'Light' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'heavy', label: 'Heavy' },
              { value: 'prefer-not', label: 'Prefer not to say' },
            ]}
          />
        </div>
      </div>

      <Field
        label="Long-term health constraints to model (optional)"
        render={(aria) => (
          <TextInput
            {...aria}
            value={health.longTermConstraints ?? ''}
            onChange={(event) => set({ longTermConstraints: event.target.value || undefined })}
            placeholder="e.g. back issues that limit physical work"
          />
        )}
      />
    </div>
  )
}

/* ------------------------------ 09 · Behaviour --------------------------- */

const BEHAVIOUR_META: Record<string, { label: string; low: string; high: string }> = {
  riskTolerance: { label: 'Risk tolerance', low: 'Prefer certainty', high: 'Comfortable with risk' },
  noveltySeeking: { label: 'Novelty seeking', low: 'Prefer the familiar', high: 'Seek the new' },
  adaptability: { label: 'Adaptability', low: 'Prefer routine', high: 'Adapt easily' },
  patience: { label: 'Patience', low: 'Want it now', high: 'Can wait' },
  stressTolerance: { label: 'Stress tolerance', low: 'Feel it strongly', high: 'Steady under pressure' },
  careerAmbition: { label: 'Career ambition', low: 'Content where I am', high: 'Want to climb' },
  discipline: { label: 'Discipline', low: 'Spontaneous', high: 'Structured' },
  persistence: { label: 'Persistence', low: 'Cut losses early', high: 'Push through' },
  learningInclination: { label: 'Learning inclination', low: 'Learn when needed', high: 'Love learning' },
  entrepreneurialTendency: { label: 'Entrepreneurial tendency', low: 'Prefer employment', high: 'Born to build' },
  financialRestraint: { label: 'Financial restraint', low: 'Spend freely', high: 'Save diligently' },
  sociability: { label: 'Sociability', low: 'Value solitude', high: 'Very social' },
  familyOrientation: { label: 'Family orientation', low: 'Fiercely independent', high: 'Family-centred' },
  geographicMobility: { label: 'Geographic mobility', low: 'Deeply rooted', high: 'Ready to move' },
}

const BEHAVIOUR_GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Mindset', keys: ['riskTolerance', 'noveltySeeking', 'adaptability', 'patience', 'stressTolerance'] },
  {
    title: 'Work & money',
    keys: ['careerAmbition', 'discipline', 'persistence', 'learningInclination', 'entrepreneurialTendency', 'financialRestraint'],
  },
  { title: 'People & place', keys: ['sociability', 'familyOrientation', 'geographicMobility'] },
]

export function StepBehaviour() {
  const draft = useDraft()
  const patch = usePatch()
  const behaviours = draft.behaviours ?? {}
  const set = (key: string, value: number | undefined) =>
    patch((d) => ({ ...d, behaviours: { ...d.behaviours, [key]: value } }))

  return (
    <div className="flex flex-col gap-6">
      <InlineNotice tone="info">
        Tendencies, not judgements — every position is a valid way to live a life. They change
        probabilities in the simulation, like wind on a route.
      </InlineNotice>

      {BEHAVIOUR_GROUPS.map((group) => (
        <div key={group.title} className="border-t border-line pt-4">
          <p className="mb-4 text-[11px] font-semibold tracking-wide text-faint uppercase">{group.title}</p>
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {group.keys.map((key) => {
              const meta = BEHAVIOUR_META[key]!
              return (
                <OptionalSlider
                  key={key}
                  label={meta.label}
                  value={behaviours[key as keyof typeof behaviours]}
                  onChange={(value) => set(key, value)}
                  lowLabel={meta.low}
                  highLabel={meta.high}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------- 10 · Goals ----------------------------- */

export function StepGoals() {
  const draft = useDraft()
  const patch = usePatch()
  const goals = draft.goals ?? {}
  const set = (key: GoalKey, value: number | undefined) =>
    patch((d) => ({ ...d, goals: { ...d.goals, [key]: value } }))

  return (
    <div className="flex flex-col gap-5">
      <InlineNotice tone="info" title="How goals work">
        These weights shape how simulated futures are compared for you. They never control what
        events happen — the world doesn't read your wishlist.
      </InlineNotice>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        {GOAL_KEYS.map((key) => (
          <OptionalSlider
            key={key}
            label={GOAL_LABELS[key]}
            value={goals[key]}
            onChange={(value) => set(key, value)}
          />
        ))}
      </div>
    </div>
  )
}

/* ----------------------------- 11 · Constraints -------------------------- */

export function StepConstraints() {
  const draft = useDraft()
  const patch = usePatch()
  const constraints = draft.constraints ?? {}
  const set = (next: Partial<typeof constraints>) =>
    patch((d) => ({ ...d, constraints: { ...d.constraints, ...next } }))

  return (
    <div className="flex flex-col gap-5">
      <InlineNotice tone="info">
        Constraints are real limits the simulator must respect — they make futures more realistic,
        not smaller.
      </InlineNotice>

      <div className="flex flex-col gap-3">
        <Toggle label="I cannot relocate (even within my country)" checked={constraints.cannotRelocate ?? false} onChange={(cannotRelocate) => set({ cannotRelocate })} />
        <Toggle label="I'm unwilling to relocate internationally" checked={constraints.unwillingToRelocateInternationally ?? false} onChange={(unwillingToRelocateInternationally) => set({ unwillingToRelocateInternationally })} />
        <Toggle label="Family care obligations tie me here" checked={constraints.familyCareObligations ?? false} onChange={(familyCareObligations) => set({ familyCareObligations })} />
        <Toggle label="Education in progress limits my options" checked={constraints.educationConstraints ?? false} onChange={(educationConstraints) => set({ educationConstraints })} />
        <Toggle label="Debt obligations limit my options" checked={constraints.debtObligations ?? false} onChange={(debtObligations) => set({ debtObligations })} />
        <Toggle label="Health limitations shape what I can do" checked={constraints.healthLimitations ?? false} onChange={(healthLimitations) => set({ healthLimitations })} />
        <Toggle label="Immigration status restricts my options" checked={constraints.immigrationRestrictions ?? false} onChange={(immigrationRestrictions) => set({ immigrationRestrictions })} />
      </div>

      <Field
        label="Anything else the simulator should respect? (optional)"
        render={(aria) => (
          <TextInput
            {...aria}
            value={constraints.notes ?? ''}
            onChange={(event) => set({ notes: event.target.value || undefined })}
            placeholder="e.g. family business expectations"
          />
        )}
      />
    </div>
  )
}
