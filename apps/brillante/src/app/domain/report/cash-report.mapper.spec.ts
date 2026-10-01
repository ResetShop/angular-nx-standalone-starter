import { createMockCashReportTransaction } from '@providers/report/report.mock'
import { mapCashReportEntries } from './cash-report.mapper'

describe('mapCashReportEntries', () => {
	it('should map an income to a positive balance', () => {
		const [entry] = mapCashReportEntries([createMockCashReportTransaction({ amount: '1500.50' })])

		expect(entry).toMatchObject({ income: 1500.5, expense: 0, balance: 1500.5 })
	})

	it('should map an expense to a negative balance', () => {
		const [entry] = mapCashReportEntries([
			createMockCashReportTransaction({
				amount: '200',
				concept: {
					id: 20,
					description: 'Rent',
					transactionType: { id: 0, description: 'Egreso' },
					parent: { id: 3, description: 'Fixed costs' },
				},
			}),
		])

		expect(entry).toMatchObject({ income: 0, expense: 200, balance: -200 })
	})

	it('should parse the ISO date into a Date', () => {
		const [entry] = mapCashReportEntries([createMockCashReportTransaction({ date: '2026-03-10T14:30:00.000Z' })])

		expect(entry.date).toBeInstanceOf(Date)
		expect(entry.date.toISOString()).toBe('2026-03-10T14:30:00.000Z')
	})

	it('should split concept and subconcept by the parent of the transaction concept', () => {
		const [entry] = mapCashReportEntries([createMockCashReportTransaction()])

		expect(entry.conceptName).toBe('Services')
		expect(entry.subconceptName).toBe('Repairs')
	})

	it('should use the concept itself when it has no parent', () => {
		const [entry] = mapCashReportEntries([
			createMockCashReportTransaction({
				concept: {
					id: 10,
					description: 'Sales',
					transactionType: { id: 1, description: 'Ingreso' },
					parent: null,
				},
			}),
		])

		expect(entry.conceptName).toBe('Sales')
		expect(entry.subconceptName).toBe('')
	})

	it('should fall back to empty text for missing optional data', () => {
		const [entry] = mapCashReportEntries([
			createMockCashReportTransaction({ note: null, officeBranch: null, audit: null }),
		])

		expect(entry).toMatchObject({ note: '', branchName: '', createdBy: '' })
	})

	it('should treat a malformed amount as zero', () => {
		const [entry] = mapCashReportEntries([createMockCashReportTransaction({ amount: 'n/a' })])

		expect(entry.balance).toBe(0)
	})

	it.each([49, 163])('should drop the cash register marker concept %i', (conceptId) => {
		const entries = mapCashReportEntries([
			createMockCashReportTransaction({
				id: 1,
				concept: {
					id: conceptId,
					description: 'Register',
					transactionType: { id: 1, description: 'Ingreso' },
					parent: null,
				},
			}),
			createMockCashReportTransaction({ id: 2 }),
		])

		expect(entries.map((entry) => entry.id)).toEqual([2])
	})

	it('should order the entries by id', () => {
		const entries = mapCashReportEntries([
			createMockCashReportTransaction({ id: 3 }),
			createMockCashReportTransaction({ id: 1 }),
			createMockCashReportTransaction({ id: 2 }),
		])

		expect(entries.map((entry) => entry.id)).toEqual([1, 2, 3])
	})
})
