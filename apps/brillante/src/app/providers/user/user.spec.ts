import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../../environments/environment'
import { HttpUserApi } from './user'

describe('HttpUserApi', () => {
	let api: HttpUserApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
		api = TestBed.inject(HttpUserApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('lists users with GET /users', () => {
		api.getAll().subscribe()

		expect(httpMock.expectOne(`${environment.apiUrl}/users`).request.method).toBe('GET')
	})

	it('reads one user with GET /users/:id', () => {
		api.getById(3).subscribe()

		expect(httpMock.expectOne(`${environment.apiUrl}/users/3`).request.method).toBe('GET')
	})

	it('registers a user with POST /users/register', () => {
		const body = {
			email: 'new@brillante.test',
			firstName: 'New',
			lastName: 'User',
			userName: 'new',
			roles: [{ id: 3, description: 'Counter clerk' }],
		}

		api.register(body).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/users/register`)
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual(body)
	})

	it('updates a user with PUT /users/:id', () => {
		api.update({ id: 3, firstName: 'Renamed' }).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/users/3`)
		expect(req.request.method).toBe('PUT')
		expect(req.request.body).toEqual({ id: 3, firstName: 'Renamed' })
	})

	it('saves a customer profile with PUT /users/updateCustomerUser', () => {
		api.updateCustomerUser({ id: 3 }, { dni: 30111222 }).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/users/updateCustomerUser`)
		expect(req.request.method).toBe('PUT')
		expect(req.request.body).toEqual({ user: { id: 3 }, customer: { dni: 30111222 } })
	})

	it('deletes a user with DELETE /users/:id', () => {
		api.delete(3).subscribe()

		expect(httpMock.expectOne(`${environment.apiUrl}/users/3`).request.method).toBe('DELETE')
	})
})
