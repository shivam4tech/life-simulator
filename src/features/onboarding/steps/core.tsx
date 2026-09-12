import { useOnboardingStore } from '@/app/store/onboarding'
import { Combobox, Field, TextInput, Toggle } from '@/components/ui'
import { listCountryProfiles } from '@/data/countries'
import { known, unknownValue } from '@/domain'
import {
  RESIDENCY_STATUSES,
  SETTLEMENT_TYPES,
  type SettlementType,
} from '@/domain/taxonomies'
import { MaybeNumberInput, OptionalSelect, OptionalSlider } from '../controls'

/** Shared hook for steps: patch + draft. */
export const useDraft = () => useOnboardingStore((state) => state.draft)
export const usePatch = () => useOnboardingStore((state) => state.patch)

/* ------------------------------ 01 · You ------------------------------- */

export function StepYou() {
  const draft = useDraft()
  const patch = usePatch()
  return (
    <div className="flex flex-col gap-5">
      <MaybeNumberInput
        label="Age"
        value={draft.demographics.age}
        onChange={(age) =>
          patch((d) => ({ ...d, demographics: { ...d.demographics, age: age ?? unknownValue() } }))
        }
        min={1}
        max={100}
        hint="Skip if you'd rather not say — futures get less specific."
      />
      <OptionalSelect
        label="Sex (used only where simulation relevance is justified)"
        value={draft.demographics.sex}
        onChange={(sex) => patch((d) => ({ ...d, demographics: { ...d.demographics, sex } }))}
        options={[
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
          { value: 'intersex', label: 'Intersex' },
          { value: 'other', label: 'Other' },
          { value: 'prefer-not-to-answer', label: 'Prefer not to answer' },
        ]}
        hint="Never used as a crude success multiplier — never required."
      />
    </div>
  )
}

/* --------------------------- 02 · Where you live ------------------------ */

const countryOptions = listCountryProfiles().map((country) => ({
  value: country.identity.code,
  label: country.identity.name,
  detail: country.identity.currency,
  keywords: [country.identity.region, country.identity.currency],
}))

export function StepWhere() {
  const draft = useDraft()
  const patch = usePatch()
  const { demographics } = draft
  const isCitizen = demographics.citizenships.includes(demographics.countryOfResidence)

  const setCountry = (code: string) => {
    patch((d) => {
      const citizenships = d.demographics.citizenships.filter((c) => c !== d.demographics.countryOfResidence)
      return {
        ...d,
        demographics: {
          ...d.demographics,
          countryOfResidence: code,
          citizenships: isCitizen || citizenships.length === 0 ? [...new Set([code, ...citizenships])] : citizenships,
        },
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted">Country of residence</span>
        <Combobox
          options={countryOptions}
          value={demographics.countryOfResidence || undefined}
          onChange={setCountry}
          placeholder="Choose a country…"
          searchPlaceholder="Search countries…"
          aria-label="Country of residence"
        />
        <p className="text-[11px] text-faint">
          Shapes currency, costs, labour market and social context throughout the simulation.
        </p>
      </div>

      <Toggle
        label={`I am a citizen of ${countryOptions.find((c) => c.value === demographics.countryOfResidence)?.label ?? 'this country'}`}
        checked={isCitizen}
        onChange={(checked) =>
          patch((d) => ({
            ...d,
            demographics: {
              ...d.demographics,
              citizenships: checked
                ? [...new Set([d.demographics.countryOfResidence, ...d.demographics.citizenships])]
                : d.demographics.citizenships.filter((c) => c !== d.demographics.countryOfResidence),
            },
          }))
        }
      />

      {demographics.citizenships.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-faint">Citizenships:</span>
          {demographics.citizenships.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() =>
                patch((d) => ({
                  ...d,
                  demographics: {
                    ...d.demographics,
                    citizenships: d.demographics.citizenships.filter((c) => c !== code),
                  },
                }))
              }
              className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-line px-2 py-0.5 text-xs text-muted transition-colors hover:border-danger/50 hover:text-danger"
              aria-label={`Remove citizenship ${code}`}
            >
              {code}
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <OptionalSelect
        label="Residency status (if different from citizenship)"
        value={demographics.residencyStatus}
        onChange={(residencyStatus) => patch((d) => ({ ...d, demographics: { ...d.demographics, residencyStatus } }))}
        options={RESIDENCY_STATUSES.filter((s) => s.id !== 'citizen').map((s) => ({ value: s.id, label: s.label }))}
        placeholder="Citizen — nothing to add"
        hint="Residents and citizens can face different constraints later."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Region / state / province" render={(aria) => (
          <TextInput
            {...aria}
            value={demographics.region ?? ''}
            onChange={(event) => patch((d) => ({ ...d, demographics: { ...d.demographics, region: event.target.value || undefined } }))}
            placeholder="Optional"
          />
        )} />
        <Field label="City" render={(aria) => (
          <TextInput
            {...aria}
            value={demographics.city ?? ''}
            onChange={(event) => patch((d) => ({ ...d, demographics: { ...d.demographics, city: event.target.value || undefined } }))}
            placeholder="Optional"
          />
        )} />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Settlement type</span>
        <SettlementPicker
          value={demographics.settlementType}
          onChange={(settlementType) => patch((d) => ({ ...d, demographics: { ...d.demographics, settlementType } }))}
        />
      </div>
    </div>
  )
}

function SettlementPicker({
  value,
  onChange,
}: {
  value: SettlementType | undefined
  onChange: (value: SettlementType) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SETTLEMENT_TYPES.map((type) => (
        <button
          key={type.id}
          type="button"
          onClick={() => onChange(type.id)}
          aria-pressed={value === type.id}
          className={
            value === type.id
              ? 'cursor-pointer rounded-md border border-accent bg-accent-soft px-3 py-1.5 text-xs font-medium text-fg'
              : 'cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-150 hover:border-line-strong hover:text-fg'
          }
        >
          {type.label}
        </button>
      ))}
    </div>
  )
}

/* ----------------------------- 03 · Education --------------------------- */

export function StepEducation() {
  const draft = useDraft()
  const patch = usePatch()
  const education = draft.education ?? {}
  const set = (next: Partial<typeof education>) =>
    patch((d) => ({ ...d, education: { ...d.education, ...next } }))

  return (
    <div className="flex flex-col gap-5">
      <OptionalSelect
        label="Highest education level"
        value={education.level}
        onChange={(level) => set({ level })}
        options={[
          { value: 'none', label: 'No formal education' },
          { value: 'primary', label: 'Primary / basic' },
          { value: 'lower-secondary', label: 'Lower secondary' },
          { value: 'upper-secondary', label: 'Upper secondary' },
          { value: 'vocational', label: 'Vocational / post-secondary' },
          { value: 'short-cycle-tertiary', label: 'Short-cycle tertiary' },
          { value: 'bachelor', label: 'Bachelor-equivalent' },
          { value: 'master', label: 'Master-equivalent' },
          { value: 'doctorate', label: 'Doctorate / professional doctorate' },
          { value: 'professional-certification', label: 'Professional certification' },
          { value: 'other', label: 'Other' },
        ]}
        hint="Generic levels — your local qualification name is welcome below."
      />

      <Field
        label="Local qualification name (optional)"
        description="Descriptive only — e.g. B.Com, Abitur, GED. The generic level above does the modelling."
        render={(aria) => (
          <TextInput
            {...aria}
            value={education.localQualificationName ?? ''}
            onChange={(event) => set({ localQualificationName: event.target.value || undefined })}
            placeholder="e.g. B.Sc. Physics"
          />
        )}
      />

      <Field label="Field of study (optional)" render={(aria) => (
        <TextInput
          {...aria}
          value={education.field ?? ''}
          onChange={(event) => set({ field: event.target.value || undefined })}
          placeholder="e.g. Mechanical engineering"
        />
      )} />

      <Toggle
        label="Currently studying"
        description="Courses, degrees or training programmes in progress"
        checked={education.currentlyStudying ?? false}
        onChange={(currentlyStudying) => set({ currentlyStudying })}
      />

      {!education.currentlyStudying && (
        <MaybeNumberInput
          label="Years since completing it"
          value={education.yearsSinceCompletion}
          onChange={(yearsSinceCompletion) => set({ yearsSinceCompletion })}
          min={0}
          max={70}
        />
      )}

      <OptionalSelect
        label="Institution selectivity (broad self-assessment, optional)"
        value={education.institutionSelectivity}
        onChange={(institutionSelectivity) => set({ institutionSelectivity })}
        options={[
          { value: 'open-admission', label: 'Open admission' },
          { value: 'moderately-selective', label: 'Moderately selective' },
          { value: 'selective', label: 'Selective' },
          { value: 'highly-selective', label: 'Highly selective' },
        ]}
      />

      <OptionalSlider
        label="Willingness to study or retrain in the future"
        value={education.retrainingWillingness?.kind === 'known' ? education.retrainingWillingness.value : undefined}
        onChange={(retrainingWillingness) =>
          set({
            retrainingWillingness:
              retrainingWillingness === undefined ? unknownValue() : known(retrainingWillingness),
          })
        }
        lowLabel="Reluctant"
        highLabel="Eager"
      />
    </div>
  )
}
