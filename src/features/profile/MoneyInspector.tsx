import { useMemo } from 'react'
import type { PersonProfile } from '@/domain'
import { initialiseLife } from '@/simulation'
import { deriveEconomicPosition, ECONOMIC_DATA_VERSION } from '@/simulation'
import { getCountryProfile } from '@/data/countries'
import { formatCurrencyValue } from '@/utils/format'
import { InlineNotice, Metric } from '@/components/ui'
import { Section } from '@/features/shared/Section'

/**
 * Money inspector (Sprint 9) — what money MEANS for this person in this place:
 * relative position, disposable income, housing burden, resilience. Relative
 * language over absolute amounts, provenance always visible.
 */

export interface MoneyInspectorProps {
  profile: PersonProfile
  locale?: string
  currency: string
}

const BUCKET_LABELS: Record<string, string> = {
  lower: 'Lower',
  'lower-middle': 'Lower-middle',
  middle: 'Middle',
  'upper-middle': 'Upper-middle',
  high: 'High',
  'very-high': 'Very high',
}

export function MoneyInspector({ profile, locale, currency }: MoneyInspectorProps) {
  const country = getCountryProfile(profile.demographics.countryOfResidence)
  const position = useMemo(() => {
    // Static start-state position: minimal config, deterministic seed 0.
    const state = initialiseLife(profile, {
      seed: 'inspector',
      worldScenario: 'stable',
      horizonYears: 1,
      startCalendarYear: new Date().getFullYear(),
    }, 0)
    return deriveEconomicPosition(state)
  }, [profile])

  const median = country ? Math.pow(country.assumptions.incomeLevel, 1.2) * 1000 * 12 : 0
  const grossMonthly = position.grossAnnualNominal / 12

  const relativeLine = (() => {
    if (!country) return undefined
    if (median <= 0) return undefined
    if (position.grossAnnualNominal > median * 2.2) return 'well above the modelled local median'
    if (position.grossAnnualNominal > median * 1.25) return 'above the modelled local median'
    if (position.grossAnnualNominal >= median * 0.8) return 'near the modelled local median'
    if (position.grossAnnualNominal >= median * 0.45) return 'below the modelled local median'
    return 'well below the modelled local median'
  })()

  const housingLine: Record<string, string> = {
    comfortable: 'housing sits comfortably within household resources',
    noticeable: 'housing takes a noticeable share of household resources',
    high: 'housing absorbs a high share of household resources',
    severe: 'housing absorbs a severe share of household resources',
  }

  return (
    <Section
      title="Money in detail"
      aside={<span className="text-[11px] text-faint tnum">data: {ECONOMIC_DATA_VERSION}</span>}
    >
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
        <Metric
          label="Household income"
          value={formatCurrencyValue(grossMonthly, currency, locale, { compact: true, decimals: 0 })}
          hint="per month, gross"
        />
        <Metric
          label="Local position"
          value={BUCKET_LABELS[position.incomeBucket] ?? '—'}
          hint={relativeLine}
        />
        <Metric
          label="Disposable (household)"
          value={formatCurrencyValue(position.disposableAnnualReal / 12, currency, locale, { compact: true, decimals: 0 })}
          hint="per month, after estimated deductions"
        />
        <Metric
          label="Estimated tax wedge"
          value={`${Math.round(position.taxWedge * 100)}%`}
          hint="placeholder approximation"
        />
        <Metric
          label="Housing burden"
          value={`${Math.round(position.housingBurden * 100)}%`}
          hint={housingLine[position.housingStress]}
        />
        <Metric
          label="Emergency runway"
          value={`${position.runwayMonths.toFixed(1)} mo`}
          hint="of essential expenses"
        />
        <Metric
          label="Savings rate"
          value={`${Math.round(position.savingsRate * 100)}%`}
          hint="of household income"
        />
        <Metric
          label="Income volatility"
          value={position.incomeVolatility}
          hint="by work type"
        />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-[11px] text-faint">Financial resilience</span>
          <div className="h-2 flex-1 rounded-full bg-line">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${Math.round(position.resilience * 100)}%` }} />
          </div>
          <span className="w-10 text-right text-[11px] text-faint tnum">{Math.round(position.resilience * 100)}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-faint">
          Resilience blends runway, debt burden, partner income, social protection, housing weight,
          income volatility and dependents — multidimensional by design, never wealth alone.
          Estimates derive from a placeholder economic model at fallback level{' '}
          {position.fallbackLevels.income} (country archetype) — real datasets replace them
          per-dimension.
        </p>
      </div>
      <InlineNotice tone="info" className="mt-3">
        Relative position {relativeLine ? `— ${relativeLine}` : ''}. Disposable income is an
        approximation, not a tax calculation.
      </InlineNotice>
    </Section>
  )
}
