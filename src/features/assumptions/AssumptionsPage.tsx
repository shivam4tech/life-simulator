import { useMemo, useState } from 'react'
import { Combobox, ContextualHelp, InlineNotice, Metric } from '@/components/ui'
import { Section } from '@/features/shared/Section'
import { listCountryProfiles, searchCountries } from '@/data/countries'
import { useProfileStore } from '@/app/store/profile'
import { SIMULATION_ENGINE_VERSION } from '@/simulation'
import { PROFILE_SCHEMA_VERSION } from '@/data/demo-constants'
import type { CountryProfile } from '@/domain'

const percent = (value: number | undefined): string =>
  value === undefined ? '—' : `${Math.round(value * 100)}%`

export function AssumptionsPage() {
  const profileCountry = useProfileStore((state) => state.profile?.demographics.countryOfResidence)
  const [selectedCode, setSelectedCode] = useState<string | undefined>(profileCountry ?? 'GH')

  const options = useMemo(
    () =>
      listCountryProfiles().map((country) => ({
        value: country.identity.code,
        label: country.identity.name,
        detail: country.identity.currency,
        keywords: [country.identity.region, country.identity.currency],
      })),
    [],
  )

  const selected: CountryProfile | undefined = selectedCode
    ? searchCountries(selectedCode)[0]
    : undefined

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <h1 className="font-display text-2xl font-semibold text-fg">Assumptions</h1>
      <p className="mt-1 text-sm text-muted">
        What the simulator assumes, and where every number comes from.
      </p>

      <InlineNotice tone="warning" title="Placeholder economic model" className="mt-6">
        Country values below are placeholder modelling assumptions derived from broad economic
        archetypes. They are not real-world statistics. Real public datasets will replace them
        per-dimension, and the provenance record will update with them.
      </InlineNotice>

      <Section title="Country assumptions" className="mt-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <Combobox
              options={options}
              value={selectedCode}
              onChange={setSelectedCode}
              placeholder="Choose a country"
              aria-label="Country"
              searchPlaceholder="Search countries…"
            />
          </div>
          <ContextualHelp
            explanation="Each country resolves through an economic archetype plus optional country-specific overrides. Every dimension below is a modelled coefficient, not a fact."
          />
        </div>

        {selected ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
            <Metric label="Income level" value={percent(selected.assumptions.incomeLevel)} />
            <Metric label="Price level" value={percent(selected.assumptions.priceLevel)} />
            <Metric label="Inequality (modelled)" value={percent(selected.assumptions.inequality)} />
            <Metric label="Unemployment" value={percent(selected.assumptions.unemploymentRate)} />
            <Metric label="Labour strength" value={percent(selected.assumptions.labourMarketStrength)} />
            <Metric label="Housing affordability" value={percent(selected.assumptions.housingAffordability)} />
            <Metric label="Healthcare access" value={percent(selected.assumptions.healthcareAccess)} />
            <Metric label="Education access" value={percent(selected.assumptions.educationAccess)} />
            <Metric label="Safety net" value={percent(selected.assumptions.socialSafetyNet)} />
            <Metric label="Institutional stability" value={percent(selected.assumptions.institutionalStability)} />
            <Metric label="Economic volatility" value={percent(selected.assumptions.economicVolatility)} />
            <Metric label="Inflation regime" value={selected.inflationRegime} />
          </div>
        ) : (
          <p className="text-sm text-faint">No country selected.</p>
        )}
      </Section>

      {selected && (
        <Section title="Data provenance" className="mt-8">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-faint">Source</dt>
            <dd className="text-fg">{selected.provenance.source}</dd>
            <dt className="text-faint">Reference year</dt>
            <dd className="text-fg">{selected.provenance.referenceYear ?? '— (placeholder)'}</dd>
            <dt className="text-faint">Confidence</dt>
            <dd className="text-fg">{selected.provenance.confidence}</dd>
            <dt className="text-faint">Archetype</dt>
            <dd className="text-fg">{selected.archetype}</dd>
            {selected.provenance.notes && (
              <>
                <dt className="text-faint">Note</dt>
                <dd className="text-muted">{selected.provenance.notes}</dd>
              </>
            )}
          </dl>
        </Section>
      )}

      <Section title="Model versions" className="mt-8">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-faint">Simulation engine</dt>
          <dd className="text-fg tnum">{SIMULATION_ENGINE_VERSION}</dd>
          <dt className="text-faint">Profile schema</dt>
          <dd className="text-fg tnum">v{PROFILE_SCHEMA_VERSION}</dd>
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-faint">
          Life Simulator explores modelled scenarios. It is not financial, medical, legal,
          immigration or psychological advice.
        </p>
      </Section>
    </div>
  )
}
