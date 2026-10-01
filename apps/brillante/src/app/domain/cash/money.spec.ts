import { formatMoney, roundToCents } from './money'

describe('roundToCents', () => {
	it.each([
		[1.005, 1.01],
		[10.234, 10.23],
		[0.1 + 0.2, 0.3],
		[100, 100],
	])('should round %s to %s', (input, expected) => {
		expect(roundToCents(input)).toBe(expected)
	})
})

describe('formatMoney', () => {
	it('should use dot as thousands separator and comma as decimal separator', () => {
		expect(formatMoney(1234567.5)).toBe('$ 1.234.567,50')
	})

	it('should always show two decimals', () => {
		expect(formatMoney(12)).toBe('$ 12,00')
	})

	it('should format zero', () => {
		expect(formatMoney(0)).toBe('$ 0,00')
	})
})
