import type { CashReportEntry } from './cash-report.interface'
import { summarizeCashReport } from './cash-report.summary'

function entry(overrides: Partial<CashReportEntry>): CashReportEntry {
	return {
		id: 1,
		date: new Date('2026-03-10T14:30:00'),
		branchName: 'Centro',
		conceptName: 'Services',
		subconceptName: 'Repairs',
		note: '',
		paymentMethodId: 1,
		paymentMethodName: 'Cash',
		income: 0,
		expense: 0,
		balance: 0,
		createdBy: 'clerk',
		...overrides,
	}
}

describe('summarizeCashReport', () => {
	it('should return zero totals and no groups for an empty report', () => {
		expect(summarizeCashReport([])).toEqual({
			totals: { income: 0, expense: 0, balance: 0 },
			byConcept: [],
			byPaymentMethod: [],
		})
	})

	it('should add incomes, expenses and balance', () => {
		const summary = summarizeCashReport([
			entry({ id: 1, income: 100, balance: 100 }),
			entry({ id: 2, income: 50, balance: 50 }),
			entry({ id: 3, expense: 30, balance: -30 }),
		])

		expect(summary.totals).toEqual({ income: 150, expense: 30, balance: 120 })
	})

	it('should group by concept, sorted by label', () => {
		const summary = summarizeCashReport([
			entry({ id: 1, conceptName: 'Services', income: 100, balance: 100 }),
			entry({ id: 2, conceptName: 'Accessories', income: 40, balance: 40 }),
			entry({ id: 3, conceptName: 'Services', expense: 10, balance: -10 }),
		])

		expect(summary.byConcept).toEqual([
			{ key: 'Accessories', label: 'Accessories', count: 1, income: 40, expense: 0, balance: 40 },
			{ key: 'Services', label: 'Services', count: 2, income: 100, expense: 10, balance: 90 },
		])
	})

	it('should group by payment method id and label the group with its name', () => {
		const summary = summarizeCashReport([
			entry({ id: 1, paymentMethodId: 1, paymentMethodName: 'Cash', income: 100, balance: 100 }),
			entry({ id: 2, paymentMethodId: 2, paymentMethodName: 'Mercado Pago', income: 60, balance: 60 }),
			entry({ id: 3, paymentMethodId: 1, paymentMethodName: 'Cash', expense: 20, balance: -20 }),
		])

		expect(summary.byPaymentMethod).toEqual([
			{ key: '1', label: 'Cash', count: 2, income: 100, expense: 20, balance: 80 },
			{ key: '2', label: 'Mercado Pago', count: 1, income: 60, expense: 0, balance: 60 },
		])
	})
})
