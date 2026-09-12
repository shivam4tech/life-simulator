/**
 * MoneyAmount — every monetary quantity carries its currency and time basis.
 *
 * Bare numbers like `income: 50000` are forbidden: without currency and period
 * they are meaningless in a global simulator. All engine and UI money flows
 * through this type.
 */

export type MoneyPeriod = 'month' | 'year'

export interface MoneyAmount {
  /** Amount in the currency's primary unit (never cents/satang/…). */
  value: number
  /** ISO 4217 code, e.g. "GHS", "EUR", "INR". */
  currency: string
  period?: MoneyPeriod
}

export const money = (value: number, currency: string, period?: MoneyPeriod): MoneyAmount => ({
  value,
  currency,
  period,
})

export const monthlyMoney = (value: number, currency: string): MoneyAmount => ({
  value,
  currency,
  period: 'month',
})

export const annualMoney = (value: number, currency: string): MoneyAmount => ({
  value,
  currency,
  period: 'year',
})

export const toAnnual = (amount: MoneyAmount): MoneyAmount => ({
  ...amount,
  value: amount.period === 'month' ? amount.value * 12 : amount.value,
  period: 'year',
})

export const toMonthly = (amount: MoneyAmount): MoneyAmount => ({
  ...amount,
  value: amount.period === 'year' ? amount.value / 12 : amount.value,
  period: 'month',
})

/** Add two amounts of the same currency and period; period of the first wins. */
export const addMoney = (a: MoneyAmount, b: MoneyAmount): MoneyAmount => {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot add different currencies without conversion: ${a.currency} vs ${b.currency}`,
    )
  }
  if (a.period && b.period && a.period !== b.period) {
    throw new Error(`Cannot add different periods without conversion: ${a.period} vs ${b.period}`)
  }
  return { ...a, value: a.value + b.value }
}

/** Scale an amount (e.g. household share, inflation adjustment). */
export const scaleMoney = (amount: MoneyAmount, factor: number): MoneyAmount => ({
  ...amount,
  value: amount.value * factor,
})
