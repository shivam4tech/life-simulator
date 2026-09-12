import { Combobox, Field, InlineNotice, TextInput, Toggle } from '@/components/ui'
import { OCCUPATION_FAMILIES, SENIORITY_LEVELS, EMPLOYMENT_STATUSES } from '@/domain/taxonomies'
import { getCountryProfile } from '@/data/countries'
import { MoneyInput, MaybeNumberInput, OptionalSelect, OptionalSlider } from '../controls'
import { useDraft, usePatch } from './core'

/* -------------------------------- 04 · Work ----------------------------- */

export function StepWork() {
  const draft = useDraft()
  const patch = usePatch()
  const employment = draft.employment ?? {}
  const set = (next: Partial<typeof employment>) =>
    patch((d) => ({ ...d, employment: { ...d.employment, ...next } }))
  const country = getCountryProfile(draft.demographics.countryOfResidence)

  return (
    <div className="flex flex-col gap-5">
      <OptionalSelect
        label="Employment status"
        value={employment.status}
        onChange={(status) => set({ status })}
        options={EMPLOYMENT_STATUSES.map((s) => ({ value: s.id, label: s.label }))}
        placeholder="Unknown / other"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted">Occupation family</span>
          <Combobox
            options={OCCUPATION_FAMILIES.map((f) => ({ value: f.id, label: f.label }))}
            value={employment.occupationFamily}
            onChange={(occupationFamily) => set({ occupationFamily })}
            placeholder="e.g. Healthcare, Technology…"
            searchPlaceholder="Search occupation families…"
            aria-label="Occupation family"
          />
        </div>
        <Field label="Industry (optional)" render={(aria) => (
          <TextInput
            {...aria}
            value={employment.industry ?? ''}
            onChange={(event) => set({ industry: event.target.value || undefined })}
            placeholder="e.g. App-based delivery"
          />
        )} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <OptionalSelect
          label="Seniority"
          value={employment.seniority}
          onChange={(seniority) => set({ seniority })}
          options={SENIORITY_LEVELS.map((s) => ({ value: s.id, label: s.label }))}
          placeholder="Not applicable / unknown"
        />
        <MaybeNumberInput
          label="Years of experience"
          value={employment.yearsExperience}
          onChange={(yearsExperience) => set({ yearsExperience })}
          min={0}
          max={60}
        />
      </div>

      <MoneyInput
        label="Gross income (before tax and deductions)"
        value={employment.grossIncome}
        onChange={(grossIncome) => set({ grossIncome })}
        currency={country?.identity.currency ?? ''}
        period="month"
        hint={country ? `Entered in ${country.identity.currency} (${country.identity.name}).` : 'Choose a country first for the right currency.'}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MaybeNumberInput
          label="Working hours per week (all jobs)"
          value={employment.hoursPerWeek}
          onChange={(hoursPerWeek) => set({ hoursPerWeek })}
          min={0}
          max={100}
        />
        <div className="flex items-end pb-1">
          <Toggle
            label="Job can be done remotely"
            checked={employment.remoteCompatible ?? false}
            onChange={(remoteCompatible) => set({ remoteCompatible })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 border-t border-line pt-4 sm:grid-cols-2">
        <OptionalSlider
          label="Job stability (how secure does it feel?)"
          value={employment.jobStability?.kind === 'known' ? employment.jobStability.value : undefined}
          onChange={(jobStability) => set({ jobStability: jobStability === undefined ? { kind: 'unknown' } : { kind: 'known', value: jobStability } })}
          lowLabel="Fragile"
          highLabel="Very secure"
        />
        <OptionalSlider
          label="Career satisfaction"
          value={employment.careerSatisfaction?.kind === 'known' ? employment.careerSatisfaction.value : undefined}
          onChange={(careerSatisfaction) => set({ careerSatisfaction: careerSatisfaction === undefined ? { kind: 'unknown' } : { kind: 'known', value: careerSatisfaction } })}
          lowLabel="Frustrated"
          highLabel="Fulfilled"
        />
        <OptionalSlider
          label="Openness to changing employers"
          value={employment.willingnessToChangeJobs}
          onChange={(willingnessToChangeJobs) => set({ willingnessToChangeJobs })}
          lowLabel="Would stay"
          highLabel="Would move"
        />
        <OptionalSlider
          label="Openness to changing career families"
          value={employment.willingnessToChangeCareers}
          onChange={(willingnessToChangeCareers) => set({ willingnessToChangeCareers })}
          lowLabel="Staying put"
          highLabel="Ready to pivot"
        />
        <OptionalSlider
          label="Entrepreneurial interest"
          value={employment.entrepreneurialInterest?.kind === 'known' ? employment.entrepreneurialInterest.value : undefined}
          onChange={(entrepreneurialInterest) => set({ entrepreneurialInterest: entrepreneurialInterest === undefined ? { kind: 'unknown' } : { kind: 'known', value: entrepreneurialInterest } })}
          lowLabel="Prefer employment"
          highLabel="Want my own thing"
        />
      </div>
    </div>
  )
}

/* -------------------------------- 05 · Money ---------------------------- */

export function StepMoney() {
  const draft = useDraft()
  const patch = usePatch()
  const finances = draft.finances ?? {}
  const set = (next: Partial<typeof finances>) =>
    patch((d) => ({ ...d, finances: { ...d.finances, ...next } }))
  const country = getCountryProfile(draft.demographics.countryOfResidence)
  const currency = country?.identity.currency ?? ''

  return (
    <div className="flex flex-col gap-5">
      <InlineNotice tone="info">
        Gross income is captured in the Work chapter. Leave anything blank — unknowns simply widen
        the simulated range. Amounts keep their original currency if you change country later.
      </InlineNotice>

      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <MoneyInput label="Savings" value={finances.savings} onChange={(savings) => set({ savings })} currency={currency} />
        <MoneyInput label="Emergency savings" value={finances.emergencySavings} onChange={(emergencySavings) => set({ emergencySavings })} currency={currency} />
        <MoneyInput label="Investments" value={finances.investments} onChange={(investments) => set({ investments })} currency={currency} />
        <MoneyInput label="Debt (total outstanding)" value={finances.debt} onChange={(debt) => set({ debt })} currency={currency} />
        <MoneyInput label="Major assets (optional)" value={finances.majorAssets} onChange={(majorAssets) => set({ majorAssets })} currency={currency} hint="Property, vehicles, business equity…" />
      </div>

      <div className="border-t border-line pt-4">
        <p className="mb-3 text-[11px] font-semibold tracking-wide text-faint uppercase">Monthly flows</p>
        <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          <MoneyInput label="Housing cost" value={finances.housingCost} onChange={(housingCost) => set({ housingCost })} currency={currency} period="month" hint="Rent, mortgage payment or your household share." />
          <MoneyInput label="Essential expenses" value={finances.essentialMonthlyExpenses} onChange={(essentialMonthlyExpenses) => set({ essentialMonthlyExpenses })} currency={currency} period="month" />
          <MoneyInput label="Discretionary spending" value={finances.discretionaryMonthlySpending} onChange={(discretionaryMonthlySpending) => set({ discretionaryMonthlySpending })} currency={currency} period="month" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------ 06 · Household --------------------------- */

export function StepHousehold() {
  const draft = useDraft()
  const patch = usePatch()
  const household = draft.household ?? {}
  const setHousehold = (next: Partial<typeof household>) =>
    patch((d) => ({ ...d, household: { ...d.household, ...next } }))
  const dependents = draft.dependents ?? {}
  const setDependents = (next: Partial<typeof dependents>) =>
    patch((d) => ({ ...d, dependents: { ...d.dependents, ...next } }))
  const housing = draft.housing ?? {}

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MaybeNumberInput
          label="People in your household (including you)"
          value={household.size}
          onChange={(size) => setHousehold({ size })}
          min={1}
          max={30}
        />
        <MaybeNumberInput
          label="Dependents who rely on you financially"
          value={dependents.count}
          onChange={(count) => setDependents({ count })}
          min={0}
          max={20}
        />
      </div>

      <Field label="Dependent context (optional)" render={(aria) => (
        <TextInput
          {...aria}
          value={dependents.notes ?? ''}
          onChange={(event) => setDependents({ notes: event.target.value || undefined })}
          placeholder="e.g. Ages 14, 11 and 7"
        />
      )} />

      <OptionalSelect
        label="Housing situation"
        value={housing.state}
        onChange={(state) => patch((d) => ({ ...d, housing: { ...d.housing, state } }))}
        options={[
          { value: 'family-household', label: 'Living in a family household' },
          { value: 'renting', label: 'Renting' },
          { value: 'owned-outright', label: 'Own outright' },
          { value: 'mortgage', label: 'Own with a mortgage' },
          { value: 'shared', label: 'Shared housing' },
          { value: 'employer-provided', label: 'Employer-provided housing' },
          { value: 'temporary-informal', label: 'Temporary / informal' },
          { value: 'other', label: 'Other' },
        ]}
        placeholder="Unknown / prefer not to say"
      />

      <div className="flex flex-col gap-3 border-t border-line pt-4">
        <Toggle
          label="Living with family (parents, in-laws, extended family)"
          checked={household.livingWithFamily ?? false}
          onChange={(livingWithFamily) => setHousehold({ livingWithFamily })}
        />
        <Toggle
          label="I regularly send money to family outside my household"
          description="Common and modelled — remittances affect savings and family wellbeing"
          checked={household.sendsFamilySupport ?? false}
          onChange={(sendsFamilySupport) => setHousehold({ sendsFamilySupport })}
        />
        <Toggle
          label="I receive regular financial support from family"
          checked={household.receivesFamilySupport ?? false}
          onChange={(receivesFamilySupport) => setHousehold({ receivesFamilySupport })}
        />
        <Toggle
          label="I help care for elders or others"
          description="Care time affects work hours, relocation and expenses"
          checked={household.hasCareObligations ?? false}
          onChange={(hasCareObligations) => setHousehold({ hasCareObligations })}
        />
      </div>
    </div>
  )
}

/* ---------------------------- 07 · Relationships ------------------------- */

const PARTNERED = ['dating', 'committed', 'cohabiting', 'married']

export function StepRelationships() {
  const draft = useDraft()
  const patch = usePatch()
  const prefs = draft.relationshipPreferences ?? {}
  const setPrefs = (next: Partial<typeof prefs>) =>
    patch((d) => ({ ...d, relationshipPreferences: { ...d.relationshipPreferences, ...next } }))
  const status = draft.relationshipStatus
  const partnered = status !== undefined && PARTNERED.includes(status)

  return (
    <div className="flex flex-col gap-5">
      <InlineNotice tone="info">
        Relationships stay optional. If family isn't a priority, say so here and set its goal
        weight to zero in Goals — both are fully respected.
      </InlineNotice>

      <OptionalSelect
        label="Current relationship status"
        value={status}
        onChange={(relationshipStatus) => patch((d) => ({ ...d, relationshipStatus }))}
        options={[
          { value: 'single', label: 'Single' },
          { value: 'dating', label: 'Dating' },
          { value: 'committed', label: 'Committed relationship' },
          { value: 'cohabiting', label: 'Cohabiting' },
          { value: 'married', label: 'Married / formal partnership' },
          { value: 'separated', label: 'Separated' },
          { value: 'divorced', label: 'Divorced' },
          { value: 'widowed', label: 'Widowed' },
          { value: 'other', label: 'Other' },
        ]}
        placeholder="Prefer not to answer"
      />

      {partnered && (
        <OptionalSlider
          label="Relationship satisfaction"
          value={prefs.currentRelationshipSatisfaction?.kind === 'known' ? prefs.currentRelationshipSatisfaction.value : undefined}
          onChange={(v) =>
            setPrefs({
              currentRelationshipSatisfaction: v === undefined ? { kind: 'unknown' } : { kind: 'known', value: v },
            })
          }
          lowLabel="Strained"
          highLabel="Strong"
        />
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Open to a long-term partnership in the future?</span>
        <TriPills
          value={prefs.desiresPartnership}
          onChange={(desiresPartnership) => setPrefs({ desiresPartnership })}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'unsure', label: 'Not sure' },
            { value: 'no', label: 'No' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Attitude to formalising a partnership</span>
        <TriPills
          value={prefs.marriagePreference}
          onChange={(marriagePreference) => setPrefs({ marriagePreference })}
          options={[
            { value: 'important', label: 'Important to me' },
            { value: 'open', label: 'Open to it' },
            { value: 'not-for-me', label: 'Not for me' },
            { value: 'prefer-not', label: 'Prefer not to say' },
          ]}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted">Would you like (more) children?</span>
        <TriPills
          value={prefs.childrenPreference}
          onChange={(childrenPreference) => setPrefs({ childrenPreference })}
          options={[
            { value: 'yes', label: 'Yes' },
            { value: 'no', label: 'No' },
            { value: 'unsure', label: 'Not sure' },
            { value: 'prefer-not', label: 'Prefer not to say' },
          ]}
        />
      </div>

      {(prefs.childrenPreference === 'yes' || prefs.childrenPreference === 'unsure') && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MaybeNumberInput
            label="Roughly how many?"
            value={prefs.desiredNumberOfChildren}
            onChange={(desiredNumberOfChildren) => setPrefs({ desiredNumberOfChildren })}
            min={0}
            max={12}
          />
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted">Roughly when?</span>
            <TriPills
              value={prefs.childrenTiming}
              onChange={(childrenTiming) => setPrefs({ childrenTiming })}
              options={[
                { value: 'soon', label: 'Soon' },
                { value: 'next-few-years', label: 'Next few years' },
                { value: 'later', label: 'Later' },
                { value: 'unsure', label: 'Unsure' },
              ]}
            />
          </div>
        </div>
      )}

      <Toggle
        label="Open to adoption as a route to parenthood"
        checked={prefs.opennessToAdoption ?? false}
        onChange={(opennessToAdoption) => setPrefs({ opennessToAdoption })}
      />
    </div>
  )
}

export function TriPills<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T | undefined
  onChange: (value: T) => void
  options: readonly { value: T; label: string }[]
}) {  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={
            value === option.value
              ? 'cursor-pointer rounded-md border border-accent bg-accent-soft px-3 py-1.5 text-xs font-medium text-fg'
              : 'cursor-pointer rounded-md border border-line px-3 py-1.5 text-xs text-muted transition-colors duration-150 hover:border-line-strong hover:text-fg'
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
