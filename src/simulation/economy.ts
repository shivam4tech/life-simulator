import type { CountryProfile } from '@/domain/country'
import type { LifeState } from './types'
import { placeholderProviders, type CostBasketBreakdown } from './providers'
import { countryMedianIncome } from './assumptions'

/**
 * Economic position (Sprint 9) — what money MEANS for this person, in this
 * place, in this year. Raw nominal values are never destroyed; every derived
 * figure is computed FROM them and labelled with its fallback level and
 * confidence.
 *
 * Core principle: ratios and relative position over absolute amounts.
 */

export interface EconomicPosition {
  /** Gross annual, nominal local currency. */
  grossAnnualNominal: number
  /** Estimated employee-side wedge (tax + mandatory contributions, 0–1). */
  taxWedge: number
  /** Annual disposable income, nominal. */
  disposableAnnualNominal: number
  /** Annual disposable income in start-year purchasing power. */
  disposableAnnualReal: number
  /** Household income (user + partner), disposable, real, equivalence-adjusted. */
  householdAdjustedDisposable: number
  /** Estimated percentile of individual labour income in the local distribution (0–1). */
  incomePercentile: number
  /** UI bucket derived from the percentile. */
  incomeBucket: IncomeBucket
  /** Annualised household cost basket by category (nominal). */
  basket: CostBasketBreakdown
  /** Housing cost share of disposable household income (0–1+). */
  housingBurden: number
  housingStress: HousingStress
  /** Total debt service / disposable household income (0–1+). */
  debtStress: number
  /** Emergency runway in months of essential expenses. */
  runwayMonths: number
  /** Multidimensional financial resilience (0–1). */
  resilience: number
  /** Monthly income volatility band (higher for informal/gig/self-employed). */
  incomeVolatility: 'low' | 'moderate' | 'high'
  /** Fallback ladder levels used for the main estimates (1 = most specific). */
  fallbackLevels: { income: number; costs: number; taxes: number; housing: number }
  /** Savings rate implied by current flows (0–1, can be negative). */
  savingsRate: number
}

export type IncomeBucket =
  | 'lower'
  | 'lower-middle'
  | 'middle'
  | 'upper-middle'
  | 'high'
  | 'very-high'

export type HousingStress = 'comfortable' | 'noticeable' | 'high' | 'severe'

/** Normal CDF (Abramowitz–Stegun approximation). */
export const normalCdf = (x: number): number => {
  const t = 1 / (1 + 0.2316419 * Math.abs(x))
  const poly = t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  const cdf = 1 - (Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI)) * poly
  return x >= 0 ? cdf : 1 - cdf
}

/**
 * Percentile of a log-normal income distribution: the country median anchors
 * ln-scale centre; sigma comes from the (placeholder) inequality coefficient.
 */
export const incomePercentile = (income: number, country: CountryProfile): number => {
  const median = countryMedianIncome(country)
  if (income <= 0) return 0
  const sigma = Math.max(0.15, placeholderProviders.income.incomeSigma(country))
  return clamp01(normalCdf(Math.log(income / median) / sigma))
}

export const incomeBucketFor = (percentile: number): IncomeBucket => {
  if (percentile < 0.2) return 'lower'
  if (percentile < 0.4) return 'lower-middle'
  if (percentile < 0.6) return 'middle'
  if (percentile < 0.8) return 'upper-middle'
  if (percentile < 0.95) return 'high'
  return 'very-high'
}

/** OECD-style square-root household equivalence scale (a stored modelling choice). */
export const EQUIVALENCE_SCALE_EXPONENT = 0.5
export const householdEquivalenceFactor = (householdSize: number): number =>
  Math.pow(Math.max(1, householdSize), EQUIVALENCE_SCALE_EXPONENT)

export type HousingStressThresholds = readonly [number, number, number]
/** Buckets: <0.2 comfortable, <0.35 noticeable, <0.5 high, else severe. */
export const HOUSING_STRESS_THRESHOLDS: HousingStressThresholds = [0.2, 0.35, 0.5]

export const housingStressFor = (burden: number): HousingStress => {
  if (burden < HOUSING_STRESS_THRESHOLDS[0]) return 'comfortable'
  if (burden < HOUSING_STRESS_THRESHOLDS[1]) return 'noticeable'
  if (burden < HOUSING_STRESS_THRESHOLDS[2]) return 'high'
  return 'severe'
}

/** Volatility band by employment type — informal work is genuinely riskier. */
export const incomeVolatilityFor = (state: LifeState): EconomicPosition['incomeVolatility'] => {
  if (state.employment === 'informal' || state.employment === 'gig') return 'high'
  if (state.employment === 'self-employed' || state.business) return 'high'
  if (state.employment === 'unemployed') return 'low'
  return 'moderate'
}

/** Derive the full economic position for the current state (per-year). */
export const deriveEconomicPosition = (state: LifeState): EconomicPosition => {
  const income = placeholderProviders.income
  const prices = placeholderProviders.prices
  const labour = placeholderProviders.labour
  const housing = placeholderProviders.housing
  const tax = placeholderProviders.tax

  const personalAnnual = state.monthlyIncome * 12
  const partnerAnnual = (state.partner?.monthlyIncome ?? 0) * 12
  const grossHouseholdAnnual = personalAnnual + partnerAnnual

  const wedge = incomeVolatilityFor(state) === 'high' && state.employment !== 'self-employed'
    ? tax.employeeWedge(state.country, personalAnnual) * 0.45 // informal income is largely untaxed
    : tax.employeeWedge(state.country, grossHouseholdAnnual)

  const disposableHouseholdNominal = Math.max(0, grossHouseholdAnnual * (1 - wedge))
  const disposablePersonalReal = (personalAnnual * (1 - wedge)) / state.inflationIndex
  const disposableHouseholdReal = disposableHouseholdNominal / state.inflationIndex

  const basket = prices.costBasket(state.country, state.settlement, state.householdSize, state.costMultiplier)
  const childSupport = state.childSupportMonthly * 12
  const remittances = state.sendsSupport ? state.supportShare * state.monthlyIncome * 12 : 0
  const annualOutgoings = (basket.total + childSupport + remittances) * (1 - 0) // basket already base-year; index below
  const annualOutgoingsNominal = annualOutgoings * state.inflationIndex

  const equivalence = householdEquivalenceFactor(state.householdSize)
  const householdAdjustedDisposable = disposableHouseholdReal / equivalence

  const personalDisposableReal = disposablePersonalReal
  const percentile = incomePercentile(personalDisposableReal / 1, state.country)

  const housingBurden = disposableHouseholdNominal > 0
    ? clampRatio(basket.housing / disposableHouseholdNominal)
    : 0
  const housingStress = housingStressFor(housingBurden)

  const debtService = state.debt * 0.12
  const debtStress = disposableHouseholdNominal > 0
    ? clampRatio(debtService / disposableHouseholdNominal)
    : 0

  // Runway against actual outgoings (children, care, support included),
  // counting only the essential ~88% as non-deferrable.
  const essentialAnnual = (state.annualExpenses > 0 ? state.annualExpenses : annualOutgoingsNominal) * 0.88
  const runwayMonths = essentialAnnual > 0 ? (state.savings + state.investments) / (essentialAnnual / 12) : 0

  const savingsRate = grossHouseholdAnnual > 0
    ? clampRatio((grossHouseholdAnnual - annualOutgoingsNominal - debtService) / grossHouseholdAnnual)
    : 0

  const volatility = incomeVolatilityFor(state)

  // Financial resilience: multidimensional by design — never wealth alone.
  const resilience = clamp01(
    sigmoidish(runwayMonths / 9) * 0.34 +
      (1 - clampRatio(debtStress * 2)) * 0.2 +
      (state.partner && state.partner.monthlyIncome > 0 ? 0.14 : 0) +
      state.country.assumptions.socialSafetyNet * 0.14 +
      (state.sendsSupport ? 0 : 0.06) +
      (volatility === 'low' ? 0.08 : volatility === 'moderate' ? 0.04 : 0) +
      (1 - clampRatio(housingBurden)) * 0.1 +
      (state.children.filter((c) => c.livingWithUser).length === 0 ? 0.04 : 0),
  )

  return {
    grossAnnualNominal: grossHouseholdAnnual,
    taxWedge: wedge,
    disposableAnnualNominal: disposableHouseholdNominal,
    disposableAnnualReal: disposableHouseholdReal,
    householdAdjustedDisposable,
    incomePercentile: percentile,
    incomeBucket: incomeBucketFor(percentile),
    basket,
    housingBurden,
    housingStress,
    debtStress,
    runwayMonths,
    resilience,
    incomeVolatility: volatility,
    fallbackLevels: {
      income: placeholderProviders.indicators.fallbackLevel(state.country, 'income'),
      costs: placeholderProviders.indicators.fallbackLevel(state.country, 'costs'),
      taxes: placeholderProviders.indicators.fallbackLevel(state.country, 'taxes'),
      housing: placeholderProviders.indicators.fallbackLevel(state.country, 'housing'),
    },
    savingsRate,
  }

  void labour
  void income
  void housing
}

const clampRatio = (value: number): number => Math.min(2.5, Math.max(0, Number.isFinite(value) ? value : 0))
const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))
const sigmoidish = (x: number): number => 1 / (1 + Math.exp(-x))

/** Home purchase affordability (Sprint 9): ratio-based, never a fixed price. */
export interface HomePurchaseAssessment {
  affordable: boolean
  price: number
  downPayment: number
  mortgage: number
  reasons: string[]
}

export const assessHomePurchase = (state: LifeState): HomePurchaseAssessment => {
  const housing = placeholderProviders.housing
  const tax = placeholderProviders.tax
  const householdAnnual = (state.monthlyIncome + (state.partner?.monthlyIncome ?? 0)) * 12
  const price = housing.priceToIncome(state.country, state.settlement) * householdAnnual
  const downPaymentShare = housing.downPaymentShare(state.country)
  const downPayment = price * downPaymentShare
  const disposable = householdAnnual * (1 - tax.employeeWedge(state.country, householdAnnual))
  const existingDebtBurden = state.debt / Math.max(disposable, 1)
  // A mortgage is repaid over decades: banks lend a multiple of gross annual
  // income (typically 5–10× depending on rates and stability), not of the price.
  const grossHousehold = state.monthlyIncome + (state.partner?.monthlyIncome ?? 0)
  const borrowable = 9 * grossHousehold * 12
  const affordable =
    state.savings >= downPayment &&
    price - downPayment <= borrowable - state.debt &&
    existingDebtBurden < 1.5
  const reasons: string[] = [
    `price ≈ ${Math.round(housing.priceToIncome(state.country, state.settlement))}× household income`,
    state.savings >= downPayment
      ? 'down payment covered'
      : `down payment short (have ${Math.round((state.savings / Math.max(downPayment, 1)) * 100)}%)`,
    existingDebtBurden >= 1.5 ? 'existing debt too heavy for a mortgage (modelled)' : 'debt service acceptable',
  ]
  return { affordable, price, downPayment, mortgage: price - downPayment, reasons }
}
