import type { MoneyAmount, MoneyPeriod } from '@/domain/money'

/**
 * Locale-aware formatting primitives.
 * Never build currency strings by hand; everything routes through Intl.
 */

const resolveLocale = (locale?: string): string | undefined => {
  if (!locale) return undefined
  try {
    // Validate: Intl throws for malformed locales on construction.
    new Intl.NumberFormat(locale)
    return locale
  } catch {
    return undefined
  }
}

export const formatNumber = (value: number, locale?: string): string =>
  new Intl.NumberFormat(resolveLocale(locale)).format(value)

export const formatCompactNumber = (value: number, locale?: string): string =>
  new Intl.NumberFormat(resolveLocale(locale), { notation: 'compact', maximumFractionDigits: 1 }).format(
    value,
  )

export const formatPercent = (fraction: number, locale?: string, decimals = 0): string =>
  new Intl.NumberFormat(resolveLocale(locale), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fraction)

export interface CurrencyFormatOptions {
  compact?: boolean
  decimals?: number
}

export const formatMoney = (
  amount: MoneyAmount,
  locale?: string,
  options: CurrencyFormatOptions = {},
): string => formatCurrencyValue(amount.value, amount.currency, locale, options)

/** Format a bare number in a known currency (engine outputs). */
export const formatCurrencyValue = (
  value: number,
  currency: string,
  locale?: string,
  options: CurrencyFormatOptions = {},
): string => {
  const { compact = false, decimals } = options
  return new Intl.NumberFormat(resolveLocale(locale), {
    style: 'currency',
    currency,
    notation: compact ? 'compact' : 'standard',
    ...(decimals !== undefined
      ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
      : {}),
  }).format(value)
}

/** "9,500 / month" style suffix from a MoneyAmount's period. */
export const periodSuffix = (period: MoneyPeriod | undefined): string =>
  period === 'month' ? '/ month' : period === 'year' ? '/ year' : ''

/** Human label for a currency code in explanatory copy. */
export const currencyLabel = (currency: string): string => currency || 'local currency'
