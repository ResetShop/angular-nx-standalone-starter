import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import type { CreateCustomerRequest, CustomerDto } from '@contracts/client/client.types'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../../environments/environment'
import { HttpCustomerApi } from './customer'

const customer: CustomerDto = {
	id: 5,
	dni: 30111222,
	firstName: 'Ana',
	lastName: 'Pérez',
	email: 'ana@brillante.test',
	birthDate: '1990-05-01T00:00:00.000Z',
	address: 'Mitre 10',
	telephone: '3415551234',
}

describe('HttpCustomerApi', () => {
	let api: HttpCustomerApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
		api = TestBed.inject(HttpCustomerApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('reads a page of customers from /client/getAll/:offset/:limit', () => {
		let result: unknown

		api.getAll(20, 10).subscribe((value) => (result = value))

		const req = httpMock.expectOne(`${environment.apiUrl}/client/getAll/20/10`)
		expect(req.request.method).toBe('GET')
		req.flush({ count: 1, rows: [customer] })
		expect(result).toEqual({ count: 1, rows: [customer] })
	})

	it('reads a customer by id', () => {
		api.getById(5).subscribe()

		expect(httpMock.expectOne(`${environment.apiUrl}/client/getById/5`).request.method).toBe('GET')
	})

	it('reads a customer by e-mail, encoding the address', () => {
		api.getByEmail('ana+vip@brillante.test').subscribe()

		httpMock.expectOne(`${environment.apiUrl}/client/getByEmail/ana%2Bvip%40brillante.test`)
	})

	it('reads a customer by DNI', () => {
		api.getByDni(30111222).subscribe()

		httpMock.expectOne(`${environment.apiUrl}/client/getByDni/30111222`)
	})

	it('creates a customer and returns the `[customer, created]` tuple', () => {
		const body: CreateCustomerRequest = {
			dni: customer.dni,
			firstName: customer.firstName,
			lastName: customer.lastName,
			email: customer.email,
			birthDate: customer.birthDate,
			address: customer.address,
			telephone: customer.telephone,
		}
		let result: unknown

		api.create(body).subscribe((value) => (result = value))

		const req = httpMock.expectOne(`${environment.apiUrl}/client/create`)
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual(body)
		req.flush([customer, true])
		expect(result).toEqual([customer, true])
	})

	it('updates a customer with PUT /client/update', () => {
		api.update({ ...customer, id: 5 }).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/client/update`)
		expect(req.request.method).toBe('PUT')
		expect(req.request.body).toEqual(customer)
		req.flush([1])
	})
})
