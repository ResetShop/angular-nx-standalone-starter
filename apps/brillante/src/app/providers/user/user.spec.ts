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

	it('saves a customer profile with PUT /users/updateCustomerUser', () => {
		api.updateCustomerUser({ id: 3 }, { dni: 30111222 }).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/users/updateCustomerUser`)
		expect(req.request.method).toBe('PUT')
		expect(req.request.body).toEqual({ user: { id: 3 }, customer: { dni: 30111222 } })
	})
})
