import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { ReportApi } from './report.interface'
import { createMockCashReportTransaction } from './report.mock'
import { provideReport } from './report.provider'

describe('HttpReportApi', () => {
	let api: ReportApi
	let http: HttpTestingController

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(), provideHttpClientTesting(), provideReport()],
		})
		api = TestBed.inject(ReportApi)
		http = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		http.verify()
	})

	it('should widen the period to whole days and omit the branch when none is given', () => {
		api.getCashTransactions({ startDate: '2026-03-01', endDate: '2026-03-31' }).subscribe()

		const request = http.expectOne((candidate) => candidate.url.endsWith('/cash'))
		expect(request.request.method).toBe('GET')
		expect(request.request.params.get('startDate')).toBe('2026-03-01 00:00:00')
		expect(request.request.params.get('endDate')).toBe('2026-03-31 23:59:59')
		expect(request.request.params.has('idBranch')).toBe(false)
		request.flush([])
	})

	it('should send the branch id when a branch is selected', () => {
		api.getCashTransactions({ startDate: '2026-03-01', endDate: '2026-03-01', branchId: 4 }).subscribe()

		const request = http.expectOne((candidate) => candidate.url.endsWith('/cash'))
		expect(request.request.params.get('idBranch')).toBe('4')
		request.flush([])
	})

	it('should return the transactions sent by the API', () => {
		const transactions = [createMockCashReportTransaction({ id: 7 })]
		let received: unknown

		api
			.getCashTransactions({ startDate: '2026-03-01', endDate: '2026-03-01' })
			.subscribe((result) => (received = result))

		http.expectOne((candidate) => candidate.url.endsWith('/cash')).flush(transactions)
		expect(received).toEqual(transactions)
	})
})
