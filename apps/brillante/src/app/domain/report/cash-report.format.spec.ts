import { formatReportDateTime, formatReportDay } from './cash-report.format'

describe('cash report date formatting', () => {
	it('should format a day as yyyy-MM-dd with zero padding', () => {
		expect(formatReportDay(new Date(2026, 2, 5, 18, 0))).toBe('2026-03-05')
	})

	it('should format a date and time as yyyy-MM-dd HH:mm with zero padding', () => {
		expect(formatReportDateTime(new Date(2026, 11, 31, 7, 4))).toBe('2026-12-31 07:04')
	})
})
