import { describe, expect, it } from 'vitest'
import {
  addMoney,
  annualMoney,
  monthlyMoney,
  scaleMoney,
  toAnnual,
  toMonthly,
} from '@/domain/money'

describe('MoneyAmount', () => {
  it('converts month ↔ year without drift', () => {
    expect(toAnnual(monthlyMoney(9500, 'GHS')).value).toBe(114000)
    expect(toMonthly(annualMoney(114000, 'GHS')).value).toBeCloseTo(9500)
  })

  it('keeps period conversion idempotent when already in target period', () => {
    expect(toAnnual(annualMoney(100, 'EUR')).value).toBe(100)
    expect(toMonthly(monthlyMoney(100, 'EUR')).value).toBe(100)
  })

  it('adds amounts of the same currency and period', () => {
    expect(addMoney(monthlyMoney(100, 'GHS'), monthlyMoney(50, 'GHS')).value).toBe(150)
  })

  it('refuses cross-currency or cross-period addition without conversion', () => {
    expect(() => addMoney(monthlyMoney(100, 'GHS'), monthlyMoney(50, 'EUR'))).toThrow()
    expect(() => addMoney(monthlyMoney(100, 'GHS'), annualMoney(50, 'GHS'))).toThrow()
  })

  it('scales amounts', () => {
    expect(scaleMoney(monthlyMoney(200, 'INR'), 0.5).value).toBe(100)
  })

  it('preserves currency through transformations', () => {
    expect(toAnnual(monthlyMoney(1, 'INR')).currency).toBe('INR')
    expect(scaleMoney(monthlyMoney(1, 'JPY'), 2).currency).toBe('JPY')
  })
})
