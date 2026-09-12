import type { GoalWeights, MaybeMoney, PersonProfile } from '@/domain'
import { GOAL_LABELS, describeMaybe } from '@/domain'
import { getCountryProfile } from '@/data/countries'
import { formatMoney, periodSuffix } from '@/utils/format'
import { InlineNotice, Metric, Progress } from '@/components/ui'
import { Section } from '@/features/shared/Section'
import { isKnown } from '@/domain/values'

const describeIndex = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '—'
  if (value < 0.34) return 'Low'
  if (value < 0.67) return 'Moderate'
  return 'High'
}

const describeScale = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '—'
  if (value <= 3) return 'Low'
  if (value <= 7) return 'Moderate'
  return 'High'
}

const formatMaybeMoney = (profile: PersonProfile, amount: MaybeMoney | undefined, compact = false): string => {
  if (!amount) return 'Unknown'
  if (!isKnown(amount)) return describeMaybe(amount, () => '')
  const country = getCountryProfile(profile.demographics.countryOfResidence)
  const money = amount.value
  const formatted = formatMoney(money, country?.identity.locale, { compact, decimals: 0 })
  return [formatted, periodSuffix(money.period)].join(' ').trim()
}

const topGoals = (goals: GoalWeights | undefined): { key: string; label: string; weight: number }[] =>
  Object.entries(goals ?? {})
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([key, weight]) => ({ key, label: GOAL_LABELS[key as keyof typeof GOAL_LABELS] ?? key, weight }))

export function ProfileSummary({ profile }: { profile: PersonProfile }) {
  const country = getCountryProfile(profile.demographics.countryOfResidence)
  const settlementLabel = profile.demographics.settlementType
    ?.replace('-', ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase())
  const goals = topGoals(profile.goals)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-fg">
            {profile.displayName ?? 'Your starting state'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {describeMaybe(profile.demographics.age, (n) => String(n)) ?? '—'} ·{' '}
            {country?.identity.name ?? profile.demographics.countryOfResidence}
            {profile.demographics.city ? ` · ${profile.demographics.city}` : ''}
            {settlementLabel ? ` · ${settlementLabel}` : ''}
          </p>
        </div>
      </header>

      {profile.isFictional && (
        <InlineNotice tone="info" title="Fictional example" className="mb-6">
          This person does not exist. All values are invented for demonstration.
        </InlineNotice>
      )}

      <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
        <Metric label="Age" value={describeMaybe(profile.demographics.age, (n) => String(n))} />
        <Metric label="Country" value={country?.identity.name ?? profile.demographics.countryOfResidence} />
        <Metric
          label="Citizenship"
          value={profile.demographics.citizenships.join(', ') || '—'}
        />
        <Metric label="Household" value={describeMaybe(profile.household?.size ?? { kind: 'unknown' }, (n) => `${n}`)} />
      </div>

      <Section title="Education & work" className="mt-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          <Metric label="Education" value={profile.education?.level?.replace(/-/g, ' ') ?? 'Unknown'} />
          <Metric
            label="Occupation"
            value={profile.employment?.occupationFamily?.replace(/-/g, ' ') ?? '—'}
            hint={profile.employment?.seniority ? `${profile.employment.seniority} level` : undefined}
          />
          <Metric
            label="Gross income"
            value={formatMaybeMoney(profile, profile.employment?.grossIncome)}
          />
          <Metric
            label="Hours / week"
            value={
              profile.employment?.hoursPerWeek
                ? describeMaybe(profile.employment.hoursPerWeek, (n) => String(n))
                : '—'
            }
          />
        </div>
      </Section>

      <Section title="Money" className="mt-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          <Metric label="Savings" value={formatMaybeMoney(profile, profile.finances?.savings, true)} />
          <Metric label="Debt" value={formatMaybeMoney(profile, profile.finances?.debt, true)} />
          <Metric
            label="Housing cost"
            value={formatMaybeMoney(profile, profile.finances?.housingCost)}
          />
          <Metric label="Housing" value={profile.housing?.state?.replace(/-/g, ' ') ?? 'Unknown'} />
        </div>
      </Section>

      {goals.length > 0 && (
        <Section
          title="Top goals"
          className="mt-8"
          aside={<span className="text-[11px] text-faint">Shape how futures are compared — not what happens</span>}
        >
          <div className="flex flex-col gap-3">
            {goals.map((goal) => (
              <div key={goal.key} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs text-muted">{goal.label}</span>
                <Progress value={goal.weight / 10} className="flex-1" aria-label={`${goal.label} importance`} />
                <span className="w-7 text-right text-xs text-faint tnum">{goal.weight}/10</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="Behaviour" className="mt-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          <Metric label="Risk tolerance" value={describeScale(profile.behaviours?.riskTolerance)} />
          <Metric label="Career ambition" value={describeScale(profile.behaviours?.careerAmbition)} />
          <Metric
            label="Geographic mobility"
            value={describeScale(profile.behaviours?.geographicMobility)}
          />
          <Metric
            label="Financial restraint"
            value={describeScale(profile.behaviours?.financialRestraint)}
          />
        </div>
      </Section>

      <Section
        title="Country context"
        className="mt-8"
        aside={
          country ? (
            <span className="text-[11px] text-faint">
              model: {country.provenance.source} · confidence: {country.provenance.confidence}
            </span>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          <Metric label="Currency" value={country?.identity.currency ?? '—'} />
          <Metric
            label="Economic archetype"
            value={country ? country.archetype.replace(/-/g, ' ') : '—'}
          />
          <Metric
            label="Housing affordability"
            value={describeIndex(country?.assumptions.housingAffordability ?? null)}
          />
          <Metric
            label="Safety net"
            value={describeIndex(country?.assumptions.socialSafetyNet ?? null)}
          />
        </div>
      </Section>
    </div>
  )
}
