import type {
  CountryArchetypeId,
  CountryAssumptions,
  CountryProfile,
  CountryRegion,
  DataProvenance,
  InflationRegime,
} from '@/domain/country'
import { PLACEHOLDER_PROVENANCE, resolveCountryAssumptions } from '@/domain/country'
import { ARCHETYPE_BASELINES } from './country-archetypes'

/**
 * Country registry — identity metadata plus archetype assignment.
 *
 * Identity fields (code, name, currency, locale, languages) are factual.
 * Archetype + overrides are PLACEHOLDER modelling assumptions; override values
 * are judgement calls for plausible relative differences, not statistics.
 */

export interface CountrySeed {
  code: string
  name: string
  region: CountryRegion
  currency: string
  locale: string
  primaryLanguages: string[]
  archetype: CountryArchetypeId
  inflationRegime?: InflationRegime
  overrides?: Partial<CountryAssumptions>
}

const c = (seed: CountrySeed): CountrySeed => seed

export const COUNTRY_SEEDS: readonly CountrySeed[] = [
  // ---------- Africa ----------
  c({ code: 'GH', name: 'Ghana', region: 'africa', currency: 'GHS', locale: 'en-GH', primaryLanguages: ['English', 'Twi'], archetype: 'lower-income-developing', overrides: { incomeLevel: 0.22, educationAccess: 0.45, labourMarketStrength: 0.4 } }),
  c({ code: 'NG', name: 'Nigeria', region: 'africa', currency: 'NGN', locale: 'en-NG', primaryLanguages: ['English', 'Hausa', 'Yoruba', 'Igbo'], archetype: 'middle-income-volatile', overrides: { incomeLevel: 0.24 } }),
  c({ code: 'KE', name: 'Kenya', region: 'africa', currency: 'KES', locale: 'en-KE', primaryLanguages: ['Swahili', 'English'], archetype: 'lower-income-developing', overrides: { incomeLevel: 0.2 } }),
  c({ code: 'ZA', name: 'South Africa', region: 'africa', currency: 'ZAR', locale: 'en-ZA', primaryLanguages: ['Zulu', 'Xhosa', 'English', 'Afrikaans'], archetype: 'resource-heavy' }),
  c({ code: 'EG', name: 'Egypt', region: 'africa', currency: 'EGP', locale: 'ar-EG', primaryLanguages: ['Arabic'], archetype: 'rapid-growth-emerging' }),
  c({ code: 'MA', name: 'Morocco', region: 'africa', currency: 'MAD', locale: 'ar-MA', primaryLanguages: ['Arabic', 'Berber'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.32 } }),
  c({ code: 'ET', name: 'Ethiopia', region: 'africa', currency: 'ETB', locale: 'am-ET', primaryLanguages: ['Amharic'], archetype: 'lower-income-developing' }),
  c({ code: 'TZ', name: 'Tanzania', region: 'africa', currency: 'TZS', locale: 'en-TZ', primaryLanguages: ['Swahili', 'English'], archetype: 'lower-income-developing' }),
  c({ code: 'UG', name: 'Uganda', region: 'africa', currency: 'UGX', locale: 'en-UG', primaryLanguages: ['English', 'Swahili'], archetype: 'lower-income-developing' }),
  c({ code: 'SN', name: 'Senegal', region: 'africa', currency: 'XOF', locale: 'fr-SN', primaryLanguages: ['French', 'Wolof'], archetype: 'lower-income-developing' }),
  c({ code: 'CI', name: "Côte d'Ivoire", region: 'africa', currency: 'XOF', locale: 'fr-CI', primaryLanguages: ['French'], archetype: 'lower-income-developing', overrides: { incomeLevel: 0.2 } }),
  c({ code: 'RW', name: 'Rwanda', region: 'africa', currency: 'RWF', locale: 'en-RW', primaryLanguages: ['Kinyarwanda', 'English'], archetype: 'lower-income-developing' }),
  c({ code: 'BW', name: 'Botswana', region: 'africa', currency: 'BWP', locale: 'en-BW', primaryLanguages: ['Setswana', 'English'], archetype: 'resource-heavy', overrides: { incomeLevel: 0.5 } }),

  // ---------- Asia ----------
  c({ code: 'IN', name: 'India', region: 'asia', currency: 'INR', locale: 'en-IN', primaryLanguages: ['Hindi', 'English'], archetype: 'rapid-growth-emerging' }),
  c({ code: 'CN', name: 'China', region: 'asia', currency: 'CNY', locale: 'zh-CN', primaryLanguages: ['Mandarin'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.48, labourMarketStrength: 0.7 } }),
  c({ code: 'JP', name: 'Japan', region: 'asia', currency: 'JPY', locale: 'ja-JP', primaryLanguages: ['Japanese'], archetype: 'high-income-strong-welfare', overrides: { incomeLevel: 0.85, inequality: 0.4, socialSafetyNet: 0.8, migrationAttractiveness: 0.4 } }),
  c({ code: 'KR', name: 'South Korea', region: 'asia', currency: 'KRW', locale: 'ko-KR', primaryLanguages: ['Korean'], archetype: 'high-income-market-oriented', overrides: { incomeLevel: 0.8, socialSafetyNet: 0.7 } }),
  c({ code: 'ID', name: 'Indonesia', region: 'asia', currency: 'IDR', locale: 'id-ID', primaryLanguages: ['Indonesian'], archetype: 'rapid-growth-emerging' }),
  c({ code: 'VN', name: 'Vietnam', region: 'asia', currency: 'VND', locale: 'vi-VN', primaryLanguages: ['Vietnamese'], archetype: 'rapid-growth-emerging', overrides: { incomeLevel: 0.28 } }),
  c({ code: 'PH', name: 'Philippines', region: 'asia', currency: 'PHP', locale: 'en-PH', primaryLanguages: ['Filipino', 'English'], archetype: 'rapid-growth-emerging' }),
  c({ code: 'TH', name: 'Thailand', region: 'asia', currency: 'THB', locale: 'th-TH', primaryLanguages: ['Thai'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.38 } }),
  c({ code: 'MY', name: 'Malaysia', region: 'asia', currency: 'MYR', locale: 'ms-MY', primaryLanguages: ['Malay', 'English'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.45 } }),
  c({ code: 'SG', name: 'Singapore', region: 'asia', currency: 'SGD', locale: 'en-SG', primaryLanguages: ['English', 'Mandarin', 'Malay'], archetype: 'high-income-high-cost' }),
  c({ code: 'BD', name: 'Bangladesh', region: 'asia', currency: 'BDT', locale: 'bn-BD', primaryLanguages: ['Bengali'], archetype: 'rapid-growth-emerging', overrides: { incomeLevel: 0.2 } }),
  c({ code: 'PK', name: 'Pakistan', region: 'asia', currency: 'PKR', locale: 'ur-PK', primaryLanguages: ['Urdu', 'English'], archetype: 'middle-income-volatile', overrides: { incomeLevel: 0.18 } }),
  c({ code: 'NP', name: 'Nepal', region: 'asia', currency: 'NPR', locale: 'ne-NP', primaryLanguages: ['Nepali'], archetype: 'lower-income-developing' }),
  c({ code: 'LK', name: 'Sri Lanka', region: 'asia', currency: 'LKR', locale: 'si-LK', primaryLanguages: ['Sinhala', 'Tamil'], archetype: 'middle-income-volatile', overrides: { incomeLevel: 0.3 } }),
  c({ code: 'KZ', name: 'Kazakhstan', region: 'asia', currency: 'KZT', locale: 'ru-KZ', primaryLanguages: ['Kazakh', 'Russian'], archetype: 'resource-heavy', overrides: { incomeLevel: 0.45 } }),
  c({ code: 'UZ', name: 'Uzbekistan', region: 'asia', currency: 'UZS', locale: 'ru-UZ', primaryLanguages: ['Uzbek', 'Russian'], archetype: 'lower-income-developing', overrides: { incomeLevel: 0.25 } }),
  c({ code: 'TR', name: 'Türkiye', region: 'asia', currency: 'TRY', locale: 'tr-TR', primaryLanguages: ['Turkish'], archetype: 'middle-income-volatile', overrides: { incomeLevel: 0.42 } }),
  c({ code: 'IL', name: 'Israel', region: 'asia', currency: 'ILS', locale: 'he-IL', primaryLanguages: ['Hebrew'], archetype: 'small-high-income', overrides: { incomeLevel: 0.92 } }),
  c({ code: 'AE', name: 'United Arab Emirates', region: 'asia', currency: 'AED', locale: 'en-AE', primaryLanguages: ['Arabic', 'English'], archetype: 'resource-heavy', overrides: { incomeLevel: 0.95, socialSafetyNet: 0.3, institutionalStability: 0.85, migrationAttractiveness: 0.85 } }),
  c({ code: 'SA', name: 'Saudi Arabia', region: 'asia', currency: 'SAR', locale: 'en-SA', primaryLanguages: ['Arabic'], archetype: 'resource-heavy', overrides: { incomeLevel: 0.8 } }),
  c({ code: 'QA', name: 'Qatar', region: 'asia', currency: 'QAR', locale: 'ar-QA', primaryLanguages: ['Arabic'], archetype: 'resource-heavy', overrides: { incomeLevel: 0.95 } }),
  c({ code: 'KH', name: 'Cambodia', region: 'asia', currency: 'KHR', locale: 'km-KH', primaryLanguages: ['Khmer'], archetype: 'lower-income-developing' }),
  c({ code: 'MM', name: 'Myanmar', region: 'asia', currency: 'MMK', locale: 'my-MM', primaryLanguages: ['Burmese'], archetype: 'lower-income-developing', overrides: { institutionalStability: 0.15 } }),

  // ---------- Europe ----------
  c({ code: 'DE', name: 'Germany', region: 'europe', currency: 'EUR', locale: 'de-DE', primaryLanguages: ['German'], archetype: 'high-income-strong-welfare', overrides: { socialSafetyNet: 0.9 } }),
  c({ code: 'FR', name: 'France', region: 'europe', currency: 'EUR', locale: 'fr-FR', primaryLanguages: ['French'], archetype: 'high-income-strong-welfare' }),
  c({ code: 'GB', name: 'United Kingdom', region: 'europe', currency: 'GBP', locale: 'en-GB', primaryLanguages: ['English'], archetype: 'high-income-market-oriented' }),
  c({ code: 'IT', name: 'Italy', region: 'europe', currency: 'EUR', locale: 'it-IT', primaryLanguages: ['Italian'], archetype: 'high-income-market-oriented', overrides: { incomeLevel: 0.78, labourMarketStrength: 0.55 } }),
  c({ code: 'ES', name: 'Spain', region: 'europe', currency: 'EUR', locale: 'es-ES', primaryLanguages: ['Spanish'], archetype: 'high-income-market-oriented', overrides: { incomeLevel: 0.78, unemploymentRate: 0.12 } }),
  c({ code: 'PL', name: 'Poland', region: 'europe', currency: 'PLN', locale: 'pl-PL', primaryLanguages: ['Polish'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.58, socialSafetyNet: 0.6, institutionalStability: 0.8 } }),
  c({ code: 'NL', name: 'Netherlands', region: 'europe', currency: 'EUR', locale: 'nl-NL', primaryLanguages: ['Dutch', 'English'], archetype: 'high-income-strong-welfare', overrides: { housingAffordability: 0.3 } }),
  c({ code: 'SE', name: 'Sweden', region: 'europe', currency: 'SEK', locale: 'sv-SE', primaryLanguages: ['Swedish'], archetype: 'high-income-strong-welfare' }),
  c({ code: 'NO', name: 'Norway', region: 'europe', currency: 'NOK', locale: 'nb-NO', primaryLanguages: ['Norwegian'], archetype: 'high-income-strong-welfare', overrides: { incomeLevel: 1.0 } }),
  c({ code: 'DK', name: 'Denmark', region: 'europe', currency: 'DKK', locale: 'da-DK', primaryLanguages: ['Danish'], archetype: 'high-income-strong-welfare' }),
  c({ code: 'FI', name: 'Finland', region: 'europe', currency: 'EUR', locale: 'fi-FI', primaryLanguages: ['Finnish'], archetype: 'high-income-strong-welfare' }),
  c({ code: 'CH', name: 'Switzerland', region: 'europe', currency: 'CHF', locale: 'de-CH', primaryLanguages: ['German', 'French', 'Italian'], archetype: 'high-income-high-cost' }),
  c({ code: 'AT', name: 'Austria', region: 'europe', currency: 'EUR', locale: 'de-AT', primaryLanguages: ['German'], archetype: 'high-income-strong-welfare' }),
  c({ code: 'BE', name: 'Belgium', region: 'europe', currency: 'EUR', locale: 'nl-BE', primaryLanguages: ['Dutch', 'French'], archetype: 'high-income-strong-welfare' }),
  c({ code: 'PT', name: 'Portugal', region: 'europe', currency: 'EUR', locale: 'pt-PT', primaryLanguages: ['Portuguese'], archetype: 'high-income-market-oriented', overrides: { incomeLevel: 0.68 } }),
  c({ code: 'GR', name: 'Greece', region: 'europe', currency: 'EUR', locale: 'el-GR', primaryLanguages: ['Greek'], archetype: 'high-income-market-oriented', overrides: { incomeLevel: 0.65, unemploymentRate: 0.11, socialSafetyNet: 0.6 } }),
  c({ code: 'CZ', name: 'Czechia', region: 'europe', currency: 'CZK', locale: 'cs-CZ', primaryLanguages: ['Czech'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.6, socialSafetyNet: 0.7, institutionalStability: 0.85 } }),
  c({ code: 'RO', name: 'Romania', region: 'europe', currency: 'RON', locale: 'ro-RO', primaryLanguages: ['Romanian'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.48 } }),
  c({ code: 'HU', name: 'Hungary', region: 'europe', currency: 'HUF', locale: 'hu-HU', primaryLanguages: ['Hungarian'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.5, socialSafetyNet: 0.55 } }),
  c({ code: 'UA', name: 'Ukraine', region: 'europe', currency: 'UAH', locale: 'uk-UA', primaryLanguages: ['Ukrainian'], archetype: 'middle-income-volatile', overrides: { institutionalStability: 0.2 } }),
  c({ code: 'RU', name: 'Russia', region: 'europe', currency: 'RUB', locale: 'ru-RU', primaryLanguages: ['Russian'], archetype: 'middle-income-volatile', overrides: { incomeLevel: 0.4, institutionalStability: 0.3 } }),
  c({ code: 'IE', name: 'Ireland', region: 'europe', currency: 'EUR', locale: 'en-IE', primaryLanguages: ['English', 'Irish'], archetype: 'small-high-income', overrides: { housingAffordability: 0.25 } }),

  // ---------- North America ----------
  c({ code: 'US', name: 'United States', region: 'north-america', currency: 'USD', locale: 'en-US', primaryLanguages: ['English'], archetype: 'high-income-market-oriented', overrides: { healthcareAccess: 0.55 } }),
  c({ code: 'CA', name: 'Canada', region: 'north-america', currency: 'CAD', locale: 'en-CA', primaryLanguages: ['English', 'French'], archetype: 'high-income-market-oriented', overrides: { socialSafetyNet: 0.75, healthcareAccess: 0.85 } }),
  c({ code: 'MX', name: 'Mexico', region: 'north-america', currency: 'MXN', locale: 'es-MX', primaryLanguages: ['Spanish'], archetype: 'emerging-industrial' }),
  c({ code: 'CR', name: 'Costa Rica', region: 'north-america', currency: 'CRC', locale: 'es-CR', primaryLanguages: ['Spanish'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.4, institutionalStability: 0.75 } }),
  c({ code: 'PA', name: 'Panama', region: 'north-america', currency: 'USD', locale: 'es-PA', primaryLanguages: ['Spanish'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.45 } }),
  c({ code: 'DO', name: 'Dominican Republic', region: 'north-america', currency: 'DOP', locale: 'es-DO', primaryLanguages: ['Spanish'], archetype: 'rapid-growth-emerging' }),
  c({ code: 'GT', name: 'Guatemala', region: 'north-america', currency: 'GTQ', locale: 'es-GT', primaryLanguages: ['Spanish'], archetype: 'lower-income-developing', overrides: { incomeLevel: 0.25 } }),

  // ---------- South America ----------
  c({ code: 'BR', name: 'Brazil', region: 'south-america', currency: 'BRL', locale: 'pt-BR', primaryLanguages: ['Portuguese'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.35, inequality: 0.65 } }),
  c({ code: 'AR', name: 'Argentina', region: 'south-america', currency: 'ARS', locale: 'es-AR', primaryLanguages: ['Spanish'], archetype: 'middle-income-volatile', overrides: { incomeLevel: 0.38, socialSafetyNet: 0.4 } }),
  c({ code: 'CL', name: 'Chile', region: 'south-america', currency: 'CLP', locale: 'es-CL', primaryLanguages: ['Spanish'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.45, institutionalStability: 0.75 } }),
  c({ code: 'CO', name: 'Colombia', region: 'south-america', currency: 'COP', locale: 'es-CO', primaryLanguages: ['Spanish'], archetype: 'rapid-growth-emerging', overrides: { incomeLevel: 0.32 } }),
  c({ code: 'PE', name: 'Peru', region: 'south-america', currency: 'PEN', locale: 'es-PE', primaryLanguages: ['Spanish'], archetype: 'rapid-growth-emerging', overrides: { incomeLevel: 0.3 } }),
  c({ code: 'UY', name: 'Uruguay', region: 'south-america', currency: 'UYU', locale: 'es-UY', primaryLanguages: ['Spanish'], archetype: 'emerging-industrial', overrides: { incomeLevel: 0.5, institutionalStability: 0.8, socialSafetyNet: 0.6 } }),
  c({ code: 'EC', name: 'Ecuador', region: 'south-america', currency: 'USD', locale: 'es-EC', primaryLanguages: ['Spanish'], archetype: 'rapid-growth-emerging', overrides: { incomeLevel: 0.28 } }),

  // ---------- Oceania ----------
  c({ code: 'AU', name: 'Australia', region: 'oceania', currency: 'AUD', locale: 'en-AU', primaryLanguages: ['English'], archetype: 'high-income-market-oriented', overrides: { socialSafetyNet: 0.75 } }),
  c({ code: 'NZ', name: 'New Zealand', region: 'oceania', currency: 'NZD', locale: 'en-NZ', primaryLanguages: ['English', 'Māori'], archetype: 'small-high-income' }),
  c({ code: 'FJ', name: 'Fiji', region: 'oceania', currency: 'FJD', locale: 'en-FJ', primaryLanguages: ['English', 'Fijian'], archetype: 'lower-income-developing', overrides: { incomeLevel: 0.25 } }),
]

export const PROVENANCE_NOTE: DataProvenance = PLACEHOLDER_PROVENANCE

const byCode = new Map(COUNTRY_SEEDS.map((seed) => [seed.code, seed]))

/** Resolve the full profile (identity + archetype baseline + overrides + provenance). */
export const getCountryProfile = (code: string): CountryProfile | undefined => {
  const seed = byCode.get(code.toUpperCase())
  if (!seed) return undefined
  const baseline = ARCHETYPE_BASELINES[seed.archetype]
  return {
    identity: {
      code: seed.code,
      name: seed.name,
      region: seed.region,
      currency: seed.currency,
      locale: seed.locale,
      primaryLanguages: seed.primaryLanguages,
    },
    archetype: seed.archetype,
    overrides: seed.overrides,
    inflationRegime: seed.inflationRegime ?? baseline.inflationRegime,
    assumptions: resolveCountryAssumptions(baseline, seed.overrides),
    provenance: { ...PLACEHOLDER_PROVENANCE },
  }
}

export const listCountryProfiles = (): CountryProfile[] =>
  COUNTRY_SEEDS.map((seed) => getCountryProfile(seed.code)).filter(
    (profile): profile is CountryProfile => profile !== undefined,
  )

export const searchCountries = (query: string): CountryProfile[] => {
  const q = query.trim().toLowerCase()
  if (!q) return listCountryProfiles()
  return listCountryProfiles().filter(
    (profile) =>
      profile.identity.name.toLowerCase().includes(q) ||
      profile.identity.code.toLowerCase() === q ||
      profile.identity.currency.toLowerCase() === q,
  )
}
