import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import type { CashActorDto, CashTransactionRequest } from '@contracts/cash/cash-transaction.types'
import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../../../environments/environment'
import { HttpCashApi } from './cash'
import { createMockCashTransactionDto, createMockConceptDto, createMockPaymentMethodDto } from './cash.mock'

const branch: OfficeBranchDto = { id: 2, name: 'Centro', address: 'San Martín 100' }

const user: CashActorDto = {
	id: 5,
	userName: 'clerk',
	firstName: 'Ana',
	lastName: 'Gómez',
	email: 'ana@brillante.test',
	avatar: null,
	roles: [{ id: 3, description: 'Counter clerk' }],
	hasFinishedRegistration: true,
}

const transaction: CashTransactionRequest = {
	concept: createMockConceptDto(),
	amount: 1500,
	date: '2026-03-04T15:30:00.000Z',
	note: 'Venta de mostrador',
	paymentMethod: { ...createMockPaymentMethodDto(), installments: [] },
	payments: [{ amount: 1500, paymentMethod: { ...createMockPaymentMethodDto(), installments: [] } }],
}

describe('HttpCashApi', () => {
	let api: HttpCashApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
		api = TestBed.inject(HttpCashApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	describe('getAll', () => {
		it('should send the whole day range in the legacy wire format', () => {
			api.getAll({ from: new Date(2026, 2, 1, 14, 20), to: new Date(2026, 2, 4, 3, 5) }).subscribe()

			const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/cash`)
			expect(req.request.method).toBe('GET')
			expect(req.request.params.get('startDate')).toBe('2026-03-01 00:00:00')
			expect(req.request.params.get('endDate')).toBe('2026-03-04 23:59:59')
			req.flush([])
		})

		it('should send the branch filter as idBranch', () => {
			api.getAll({ from: new Date(2026, 2, 4), to: new Date(2026, 2, 4), branchId: 2 }).subscribe()

			const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/cash`)
			expect(req.request.params.get('idBranch')).toBe('2')
			req.flush([])
		})

		it('should omit idBranch when no branch is selected', () => {
			api.getAll({ from: new Date(2026, 2, 4), to: new Date(2026, 2, 4) }).subscribe()

			const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/cash`)
			expect(req.request.params.has('idBranch')).toBe(false)
			req.flush([])
		})

		it('should emit the transactions returned by the API untouched', () => {
			const rows = [createMockCashTransactionDto()]
			let result: unknown

			api.getAll({ from: new Date(2026, 2, 4), to: new Date(2026, 2, 4) }).subscribe((value) => (result = value))

			httpMock.expectOne((r) => r.url === `${environment.apiUrl}/cash`).flush(rows)
			expect(result).toEqual(rows)
		})
	})

	it('should read a transaction from /cash/getById/:id', () => {
		api.getById(9).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/getById/9`)
		expect(req.request.method).toBe('GET')
		req.flush(createMockCashTransactionDto({ id: 9 }))
	})

	it('should create a transaction spreading it next to the user and the branch', () => {
		api.create(transaction, user, branch).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/create`)
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual({ ...transaction, user, branch })
		req.flush([createMockCashTransactionDto()])
	})

	it('should update a transaction wrapping it with the user', () => {
		api.update({ ...transaction, id: 3 }, user).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/update`)
		expect(req.request.method).toBe('PUT')
		expect(req.request.body).toEqual({ transaction: { ...transaction, id: 3 }, user })
		req.flush([1])
	})

	it('should delete a transaction by id', () => {
		api.remove(3).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/remove/3`)
		expect(req.request.method).toBe('DELETE')
		req.flush({})
	})

	it('should open the cash register sending the user and the branch', () => {
		api.open(user, branch).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/open`)
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual({ user, branch })
		req.flush(createMockCashTransactionDto())
	})

	it('should close the cash register sending the branch', () => {
		api.close(branch).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/close`)
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual({ branch })
		req.flush({})
	})

	it('should propagate HTTP errors', () => {
		let status: number | undefined

		api.remove(3).subscribe({ error: (error: { status: number }) => (status = error.status) })

		httpMock.expectOne(`${environment.apiUrl}/cash/remove/3`).flush(null, { status: 400, statusText: 'Bad Request' })
		expect(status).toBe(400)
	})
})
