import { describe, expect, it } from 'vitest'
import { formatCompactNumber, formatMoney, formatNumber, formatPercent } from '@/utils/format'
import { annualMoney, monthlyMoney } from '@/domain/money'

describe('formatting primitives', () => {
  it('formats currency with the country locale and code', () => {
    const ghs = monthlyMoney(9500, 'GHS')
    // en-GH renders the cedi with its local symbol; ISO code rendering is also valid.
    const formatted = formatMoney(ghs, 'en-GH')
    expect(formatted).toContain('9,500')
    expect(formatted).toMatch(/₵|GHS/)
  })

  it('formats compact values', () => {
    const value = annualMoney(2_400_000, 'NGN')
    expect(formatMoney(value, 'en-NG', { compact: true })).toMatch(/2\.4/)
  })

  it('formats numbers and percentages', () => {
    expect(formatNumber(12345.678, 'en-US')).toBe('12,345.678')
    expect(formatPercent(0.1845, 'en-US', 1)).toBe('18.5%')
  })

  it('compacts big numbers', () => {
    expect(formatCompactNumber(12000, 'en-US')).toMatch(/12K/)
  })

  it('survives malformed locales by falling back', () => {
    expect(formatNumber(42, 'xx-NOPE-zz')).toBe('42')
  })

  it('formats zero-decimal currencies without cents', () => {
    const jpy = annualMoney(5000000, 'JPY')
    expect(formatMoney(jpy, 'ja-JP')).not.toMatch(/\.\d/)
  })
})
