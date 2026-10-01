import { TestBed } from '@angular/core/testing'
import type { CashReportRequest } from '@contracts/report/cash-report.types'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { clearAllMocks, fn, type MockFn, spyOn } from '@resetshop/util/test-utils'
import { NEVER, of, throwError } from 'rxjs'
import { ReportApi } from '../report.interface'
import { createMockCashReportTransaction } from '../report.mock'
import { CashReportStore } from './cash-report.store'

describe('CashReportStore', () => {
	let store: InstanceType<typeof CashReportStore>
	let apiMock: Record<keyof ReportApi, MockFn>

	const request: CashReportRequest = { startDate: '2026-03-01', endDate: '2026-03-31', branchId: 2 }

	beforeEach(() => {
		clearAllMocks()
		spyOn(console, 'error')

		apiMock = { getCashTransactions: fn() }
		apiMock.getCashTransactions.mockReturnValue(of([]))

		TestBed.configureTestingModule({
			providers: [CashReportStore, { provide: ReportApi, useValue: apiMock }, provideTranslationMock()],
		})
		store = TestBed.inject(CashReportStore)
	})

	it('should not load anything until a report is requested', () => {
		expect(apiMock.getCashTransactions.calls).toHaveLength(0)
		expect(store.entries()).toEqual([])
		expect(store.request()).toBeNull()
		expect(store.hasGenerated()).toBe(false)
		expect(store.isLoadingList()).toBe(false)
		expect(store.readError()).toEqual({ list: null })
	})

	describe('generate', () => {
		it('should flag the report as loading while the request is in flight', () => {
			apiMock.getCashTransactions.mockReturnValue(NEVER)

			store.generate(request)

			expect(store.isLoadingList()).toBe(true)
		})

		it('should map the transactions to entries and remember the request', () => {
			apiMock.getCashTransactions.mockReturnValue(
				of([
					createMockCashReportTransaction({ id: 2, amount: '100' }),
					createMockCashReportTransaction({ id: 1, amount: '50' }),
				]),
			)

			store.generate(request)

			expect(apiMock.getCashTransactions.calls).toEqual([[request]])
			expect(store.entries().map((entry) => entry.id)).toEqual([1, 2])
			expect(store.request()).toEqual(request)
			expect(store.hasGenerated()).toBe(true)
			expect(store.isLoadingList()).toBe(false)
		})

		it('should derive the summary from the entries', () => {
			apiMock.getCashTransactions.mockReturnValue(
				of([
					createMockCashReportTransaction({ id: 1, amount: '100' }),
					createMockCashReportTransaction({
						id: 2,
						amount: '30',
						concept: {
							id: 20,
							description: 'Rent',
							transactionType: { id: 0, description: 'Egreso' },
							parent: { id: 3, description: 'Fixed costs' },
						},
					}),
				]),
			)

			store.generate(request)

			expect(store.summary().totals).toEqual({ income: 100, expense: 30, balance: 70 })
			expect(store.summary().byConcept.map((group) => group.label)).toEqual(['Fixed costs', 'Services'])
		})

		it('should report an empty period as generated with no entries', () => {
			store.generate(request)

			expect(store.hasGenerated()).toBe(true)
			expect(store.entries()).toEqual([])
		})

		it('should expose the read error and drop the previous report when loading fails', () => {
			store.generate(request)
			apiMock.getCashTransactions.mockReturnValue(throwError(() => new Error('boom')))

			store.generate({ ...request, startDate: '2026-02-01' })

			expect(store.readError().list).toBe('REPORTS.CASH.ERRORS.LOAD')
			expect(store.hasReadError()).toBe(true)
			expect(store.hasGenerated()).toBe(false)
			expect(store.isLoadingList()).toBe(false)
		})

		it('should clear the previous error when a new report is requested', () => {
			apiMock.getCashTransactions.mockReturnValue(throwError(() => new Error('boom')))
			store.generate(request)
			apiMock.getCashTransactions.mockReturnValue(of([]))

			store.generate(request)

			expect(store.readError()).toEqual({ list: null })
		})
	})

	describe('reload', () => {
		it('should repeat the latest request', () => {
			store.generate(request)

			store.reload()

			expect(apiMock.getCashTransactions.calls).toEqual([[request], [request]])
		})

		it('should do nothing before any report was generated', () => {
			store.reload()

			expect(apiMock.getCashTransactions.calls).toHaveLength(0)
		})
	})

	it('should clear the read error', () => {
		apiMock.getCashTransactions.mockReturnValue(throwError(() => new Error('boom')))
		store.generate(request)

		store.clearErrors()

		expect(store.readError()).toEqual({ list: null })
		expect(store.hasReadError()).toBe(false)
	})
})
