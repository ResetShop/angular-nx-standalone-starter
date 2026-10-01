import {
	isToday,
	oldestBrowsableDay,
	parseDateInputValue,
	parseDateTimeInputValue,
	rangeIncludesDay,
	toDateInputValue,
	toDateTimeInputValue,
} from './cash-date'

describe('cash date helpers', () => {
	it('should round-trip a date through the date input value', () => {
		const date = new Date(2026, 2, 4)

		expect(toDateInputValue(date)).toBe('2026-03-04')
		expect(parseDateInputValue('2026-03-04')).toEqual(date)
	})

	it('should reject an empty or malformed date input value', () => {
		expect(parseDateInputValue('')).toBeNull()
		expect(parseDateInputValue('04/03/2026')).toBeNull()
	})

	it('should round-trip a date through the datetime-local value', () => {
		const date = new Date(2026, 2, 4, 15, 30)

		expect(toDateTimeInputValue(date)).toBe('2026-03-04T15:30')
		expect(parseDateTimeInputValue('2026-03-04T15:30')).toEqual(date)
	})

	it('should reject an empty datetime-local value', () => {
		expect(parseDateTimeInputValue('')).toBeNull()
	})

	it('should detect whether a date is today', () => {
		const now = new Date(2026, 2, 4, 9, 0)

		expect(isToday(new Date(2026, 2, 4, 23, 59), now)).toBe(true)
		expect(isToday(new Date(2026, 2, 3, 23, 59), now)).toBe(false)
	})

	it('should tell whether a day lies inside an inclusive range', () => {
		const day = new Date(2026, 2, 4, 12)

		expect(rangeIncludesDay(new Date(2026, 2, 4), new Date(2026, 2, 4), day)).toBe(true)
		expect(rangeIncludesDay(new Date(2026, 2, 1), new Date(2026, 2, 3), day)).toBe(false)
		expect(rangeIncludesDay(new Date(2026, 2, 5), new Date(2026, 2, 6), day)).toBe(false)
	})

	it('should place the oldest browsable day fourteen days back at midnight', () => {
		expect(oldestBrowsableDay(new Date(2026, 2, 20, 10, 30))).toEqual(new Date(2026, 2, 6))
	})
})
