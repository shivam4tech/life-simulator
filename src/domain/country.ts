/**
 * Country architecture.
 *
 * STRICT SEPARATION (this matters for every later sprint):
 *
 *   CountryIdentity      — stable, factual metadata (code, name, currency, locale)
 *   CountryAssumptions   — MODELLING INPUTS, currently placeholder values derived
 *                          from an economic archetype. These are not real-world
 *                          statistics and must never be presented as such.
 *   DataProvenance       — where each number came from and how much to trust it
 *
 * Real public datasets (World Bank, ILO, OECD…) must later replace assumptions
 * per-dimension without touching the simulation API. The provenance record is
 * the mechanism that makes an honest upgrade path possible.
 */

import type { SettlementType } from './taxonomies'

export type CountryRegion =
  | 'africa'
  | 'asia'
  | 'europe'
  | 'north-america'
  | 'south-america'
  | 'oceania'

export interface CountryIdentity {
  /** ISO 3166-1 alpha-2, e.g. "GH". */
  code: string
  name: string
  region: CountryRegion
  /** ISO 4217 currency code used for day-to-day life, e.g. "GHS". */
  currency: string
  /** BCP 47 locale used for formatting, e.g. "en-GH". */
  locale: string
  /** Primary language(s) — modelled properly from Sprint 7. */
  primaryLanguages: string[]
}

/**
 * Multidimensional modelling assumptions. All 0–1 indices unless noted.
 * Semantics: higher = more of the named thing (affordability 0.9 = affordable;
 * volatility 0.8 = chaotic). These ARE deliberately simplified.
 */
export interface CountryAssumptions {
  /** Relative income level, ~0 (lowest) to 1 (highest), anchored to a global reference model. */
  incomeLevel: number
  /** General price level relative to the global reference model. */
  priceLevel: number
  /** Income inequality proxy: higher = wider spread. */
  inequality: number
  /** Unemployment rate placeholder, 0–1. */
  unemploymentRate: number
  /** Labour demand / hiring dynamism. */
  labourMarketStrength: number
  /** Housing affordability: higher = easier to afford. */
  housingAffordability: number
  /** Out-of-pocket healthcare accessibility. */
  healthcareAccess: number
  /** Education accessibility. */
  educationAccess: number
  /** Unemployment protection, family benefits, pensions strength. */
  socialSafetyNet: number
  /** Institutional stability / rule-of-law proxy. */
  institutionalStability: number
  /** attractiveness as a migration destination for skilled workers. */
  migrationAttractiveness: number
  /** Economic volatility (currency swings, inflation shocks, crises). */
  economicVolatility: number
}

export type InflationRegime = 'low' | 'moderate' | 'high' | 'volatile'

export interface DataProvenance {
  source: string
  /** Dataset reference year when real data exists; null for placeholder models. */
  referenceYear: number | null
  confidence: 'observed' | 'modelled' | 'extrapolated' | 'placeholder'
  notes?: string
}

export const PLACEHOLDER_PROVENANCE: DataProvenance = {
  source: 'internal placeholder model',
  referenceYear: null,
  confidence: 'placeholder',
  notes:
    'Derived from a broad economic archetype. Not real-world statistics; real datasets will replace these per-dimension.',
}

/**
 * Broad economic archetypes. Countries map to one archetype and may override
 * individual dimensions. Archetype coefficients are placeholder modelling
 * assumptions — see data/country-archetypes.ts.
 */
export type CountryArchetypeId =
  | 'high-income-strong-welfare'
  | 'high-income-market-oriented'
  | 'high-income-high-cost'
  | 'small-high-income'
  | 'emerging-industrial'
  | 'rapid-growth-emerging'
  | 'middle-income-volatile'
  | 'resource-heavy'
  | 'lower-income-developing'

export interface CountryProfile {
  identity: CountryIdentity
  archetype: CountryArchetypeId
  /** Country-specific overrides layered on top of the archetype baseline. */
  overrides?: Partial<CountryAssumptions>
  inflationRegime: InflationRegime
  /** Fully resolved assumptions (archetype + overrides). Computed via resolveCountryAssumptions. */
  assumptions: CountryAssumptions
  provenance: DataProvenance
}

/** Settlement modifiers for a given country (placeholder model for Sprint 1). */
export interface SettlementEconomics {
  /** Wage multiplier vs the national baseline. */
  wageFactor: number
  /** Cost-of-living multiplier vs the national baseline. */
  costFactor: number
  /** Housing-cost multiplier vs the national baseline. */
  housingFactor: number
  /** Relative breadth of local opportunity (labour access, networks). */
  opportunityBreadth: number
}

export const SETTLEMENT_ECONOMICS: Record<SettlementType, SettlementEconomics> = {
  rural: { wageFactor: 0.78, costFactor: 0.82, housingFactor: 0.6, opportunityBreadth: 0.55 },
  'small-town': { wageFactor: 0.85, costFactor: 0.88, housingFactor: 0.7, opportunityBreadth: 0.65 },
  'secondary-city': {
    wageFactor: 0.95,
    costFactor: 0.95,
    housingFactor: 0.85,
    opportunityBreadth: 0.85,
  },
  'major-city': { wageFactor: 1.12, costFactor: 1.1, housingFactor: 1.25, opportunityBreadth: 1.0 },
  'global-city': {
    wageFactor: 1.3,
    costFactor: 1.25,
    housingFactor: 1.7,
    opportunityBreadth: 1.15,
  },
}

export const resolveCountryAssumptions = (
  archetype: CountryAssumptions,
  overrides: Partial<CountryAssumptions> | undefined,
): CountryAssumptions => ({ ...archetype, ...overrides })
