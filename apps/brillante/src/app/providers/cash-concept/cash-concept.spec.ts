import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../../environments/environment'
import { HttpCashConceptApi } from './cash-concept'

describe('HttpCashConceptApi', () => {
	let api: HttpCashConceptApi
	let httpMock: HttpTestingController
	const concept = { id: 4, description: 'Venta' }

	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
		api = TestBed.inject(HttpCashConceptApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('reads the concept tree with GET /cash/transaction/get', () => {
		api.getAll().subscribe()

		expect(httpMock.expectOne(`${environment.apiUrl}/cash/transaction/get`).request.method).toBe('GET')
	})

	it('creates a concept wrapped in a `concept` field', () => {
		api.create(concept).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/transaction/create`)
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual({ concept })
	})

	it.each([
		['update', 'update'],
		['enable', 'enable'],
		['disable', 'disable'],
	] as const)('sends %s as PUT /cash/transaction/%s', (method, path) => {
		api[method](concept).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/cash/transaction/${path}`)
		expect(req.request.method).toBe('PUT')
		expect(req.request.body).toEqual({ concept })
	})
})
