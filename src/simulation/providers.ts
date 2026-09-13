import type { CountryProfile, OccupationFamily, SettlementType } from '@/domain'

/**
 * Data provider adapters (Sprint 9).
 *
 * The simulation must depend on NORMALIZED INTERFACES, not on specific
 * datasets. Today every provider is implemented by the internal placeholder
 * model (archetype-derived coefficients); tomorrow real public datasets
 * (World Bank, ILO, OECD…) implement the same interfaces and the engine
 * doesn't change. Provenance travels with every provider.
 *
 * No live fetching, ever: providers serve versioned local snapshots.
 */

export const ECONOMIC_DATA_VERSION = 'placeholder-econ-2026.09'

export interface DataProviderInfo {
  source: string
  version: string
  confidence: 'placeholder' | 'modelled' | 'extrapolated' | 'observed'
}

export interface IncomeDataProvider {
  info: DataProviderInfo
  /** Monthly median labour income in local currency, scaled by the reference model. */
  medianMonthlyIncome(country: CountryProfile): number
  occupationIncomeMultiplier(family: OccupationFamily): number
  seniorityMultiplier(index: number): number
  educationMultiplier(level: string | undefined): number
  settlementWageFactor(country: CountryProfile, settlement: SettlementType): number
  /** σ of the log-normal income distribution (inequality-driven). */
  incomeSigma(country: CountryProfile): number
  /** Soft ceiling as a multiple of the local median for this occupation. */
  incomeCeiling(country: CountryProfile, family: OccupationFamily): number
}

export interface PriceDataProvider {
  info: DataProviderInfo
  priceLevel(country: CountryProfile): number
  /** Cost basket: annualised per-category cost for the household. */
  costBasket(
    country: CountryProfile,
    settlement: SettlementType,
    householdSize: number,
    personalCostAnchor: number,
  ): CostBasketBreakdown
}

export interface CostBasketBreakdown {
  housing: number
  food: number
  transport: number
  utilities: number
  healthcare: number
  education: number
  childcare: number
  communications: number
  discretionary: number
  total: number
}

export interface LabourDataProvider {
  info: DataProviderInfo
  labourStrength(country: CountryProfile): number
  unemploymentRate(country: CountryProfile): number
  /** Unemployment benefit replacement rate (share of prior wage, 0 when none). */
  unemploymentReplacementRate(country: CountryProfile): number
}

export interface HousingDataProvider {
  info: DataProviderInfo
  affordability(country: CountryProfile, settlement: SettlementType): number
  /** Price-to-income ratio for a modest dwelling. */
  priceToIncome(country: CountryProfile, settlement: SettlementType): number
  /** Minimum down-payment share the market demands. */
  downPaymentShare(country: CountryProfile): number
}

export interface TaxApproximationProvider {
  info: DataProviderInfo
  /** Employee-side wedge: share of gross absorbed by tax + mandatory contributions. */
  employeeWedge(country: CountryProfile, grossAnnual: number): number
  provenance(country: CountryProfile): string
}

export interface CountryIndicatorProvider {
  info: DataProviderInfo
  assumption(country: CountryProfile, key: keyof CountryProfile['assumptions']): number
  /** Fallback ladder level used for an estimate (1 = most specific … 8 = global). */
  fallbackLevel(country: CountryProfile, dimension: 'income' | 'costs' | 'taxes' | 'housing'): number
}

/**
 * The placeholder implementations — every value derives from the
 * internal placeholder model in assumptions.ts / country-archetypes.ts.
 */
export const placeholderProviders: {
  income: IncomeDataProvider
  prices: PriceDataProvider
  labour: LabourDataProvider
  housing: HousingDataProvider
  tax: TaxApproximationProvider
  indicators: CountryIndicatorProvider
} = {
  income: {
    info: { source: 'internal placeholder model', version: ECONOMIC_DATA_VERSION, confidence: 'placeholder' },
    medianMonthlyIncome: (country) =>
      1000 * Math.pow(country.assumptions.incomeLevel, 1.2),
    occupationIncomeMultiplier: (family) => {
      const multipliers: Partial<Record<OccupationFamily, number>> = {
        administration: 0.85, agriculture: 0.55, 'arts-media': 0.8, business: 1.1,
        construction: 0.9, education: 0.85, engineering: 1.35, finance: 1.35,
        healthcare: 1.2, hospitality: 0.65, 'law-public-policy': 1.3, manufacturing: 0.85,
        'sales-marketing': 0.9, 'science-research': 1.15, 'skilled-trades': 0.95,
        technology: 1.55, 'transport-logistics': 0.8, 'service-work': 0.6,
        'military-security': 0.9, other: 0.9,
      }
      return multipliers[family] ?? 0.9
    },
    seniorityMultiplier: (index) => [0.45, 0.68, 1.0, 1.42, 1.85, 2.3, 2.9][index] ?? 1,
    educationMultiplier: (level) => {
      const multipliers: Record<string, number> = {
        none: 0.72, primary: 0.78, 'lower-secondary': 0.85, 'upper-secondary': 1.0,
        vocational: 1.05, 'short-cycle-tertiary': 1.12, bachelor: 1.28, master: 1.45,
        doctorate: 1.6, 'professional-certification': 1.2, other: 0.95,
      }
      return multipliers[level ?? 'upper-secondary'] ?? 1
    },
    settlementWageFactor: (_country, settlement) => {
      const factors: Record<SettlementType, number> = {
        rural: 0.78, 'small-town': 0.85, 'secondary-city': 0.95, 'major-city': 1.12, 'global-city': 1.3,
      }
      return factors[settlement] ?? 1
    },
    incomeSigma: (country) => 0.35 + country.assumptions.inequality * 0.35,
    incomeCeiling: (country, family) => {
      const ceilings: Partial<Record<OccupationFamily, number>> = {
        technology: 4.5, finance: 4.2, 'law-public-policy': 4.0, business: 3.6,
        engineering: 3.4, 'sales-marketing': 3.2, 'arts-media': 3.2, 'science-research': 3.0,
        healthcare: 3.0, 'skilled-trades': 2.3, administration: 2.2,
        manufacturing: 2.0, education: 2.0, 'military-security': 1.9, construction: 1.9,
        'transport-logistics': 1.8, agriculture: 1.6, hospitality: 1.5, 'service-work': 1.3,
        other: 2.0,
      } as Record<OccupationFamily, number>
      void country
      return ceilings[family] ?? 2
    },
  },
  prices: {
    info: { source: 'internal placeholder model', version: ECONOMIC_DATA_VERSION, confidence: 'placeholder' },
    priceLevel: (country) => 0.4 + country.assumptions.priceLevel * 1.1,
    costBasket: (country, settlement, householdSize, personalCostAnchor) => {
      const median = 1000 * Math.pow(country.assumptions.incomeLevel, 1.2)
      const priceFactor = 0.4 + country.assumptions.priceLevel * 1.1
      const base = median * 0.58 * priceFactor
      const scale = Math.pow(Math.max(1, householdSize), 0.62)
      const housingFactors: Record<SettlementType, number> = {
        rural: 0.6, 'small-town': 0.7, 'secondary-city': 0.85, 'major-city': 1.25, 'global-city': 1.7,
      }
      const housingShare = clamp01(0.32 * (housingFactors[settlement] ?? 1) * (2 - country.assumptions.housingAffordability))
      const monthly = (share: number): number => base * share * scale * personalCostAnchor
      const basket: CostBasketBreakdown = {
        housing: monthly(housingShare),
        food: monthly(0.22),
        transport: monthly(0.09 * (housingFactors[settlement] ?? 1) ** 0.3),
        utilities: monthly(0.08),
        healthcare: monthly(0.07 * (1.4 - country.assumptions.healthcareAccess)),
        education: monthly(0.04 * (1.3 - country.assumptions.educationAccess)),
        childcare: monthly(0.05 * (1.3 - country.assumptions.socialSafetyNet * 0.6)),
        communications: monthly(0.035),
        discretionary: 0,
        total: 0,
      }
      basket.discretionary = monthly(0.12) * (0.6 + (10 - 5) * 0.04)
      basket.total =
        basket.housing + basket.food + basket.transport + basket.utilities + basket.healthcare +
        basket.education + basket.childcare + basket.communications + basket.discretionary
      return basket
    },
  },
  labour: {
    info: { source: 'internal placeholder model', version: ECONOMIC_DATA_VERSION, confidence: 'placeholder' },
    labourStrength: (country) => country.assumptions.labourMarketStrength,
    unemploymentRate: (country) => country.assumptions.unemploymentRate,
    unemploymentReplacementRate: (country) =>
      clamp01(country.assumptions.socialSafetyNet * 0.55),
  },
  housing: {
    info: { source: 'internal placeholder model', version: ECONOMIC_DATA_VERSION, confidence: 'placeholder' },
    affordability: (country, settlement) => {
      const factors: Record<SettlementType, number> = {
        rural: 1.4, 'small-town': 1.2, 'secondary-city': 1.0, 'major-city': 0.8, 'global-city': 0.55,
      }
      return clamp01(country.assumptions.housingAffordability * (factors[settlement] ?? 1))
    },
    priceToIncome: (country, settlement) => {
      const base = 4 + (1 - country.assumptions.housingAffordability) * 6
      const factors: Record<SettlementType, number> = {
        rural: 0.7, 'small-town': 0.85, 'secondary-city': 1.0, 'major-city': 1.3, 'global-city': 1.8,
      }
      return base * (factors[settlement] ?? 1)
    },
    downPaymentShare: (country) => clamp01(0.1 + (1 - country.assumptions.institutionalStability) * 0.15),
  },
  tax: {
    info: { source: 'internal placeholder model', version: ECONOMIC_DATA_VERSION, confidence: 'placeholder' },
    employeeWedge: (country, grossAnnual) => {
      const median = 1000 * Math.pow(country.assumptions.incomeLevel, 1.2) * 12
      // Progressive approximation: low incomes mostly below thresholds in
      // lower-income countries; higher incomes cross more brackets.
      const relative = grossAnnual / Math.max(median, 1)
      const baseWedge = 0.08 + country.assumptions.socialSafetyNet * 0.22
      const progression = clamp01((relative - 0.7) * 0.18)
      return clamp01(baseWedge + progression * 0.2)
    },
    provenance: (country) =>
      `tax wedge estimated from archetype (${country.archetype}), placeholder — not a tax calculator`,
  },
  indicators: {
    info: { source: 'internal placeholder model', version: ECONOMIC_DATA_VERSION, confidence: 'placeholder' },
    assumption: (country, key) => country.assumptions[key],
    fallbackLevel: (country, dimension) => {
      // Placeholder model always resolves at level 4 (country archetype);
      // real datasets will resolve at levels 1–3.
      void country
      void dimension
      return 4
    },
  },
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}
