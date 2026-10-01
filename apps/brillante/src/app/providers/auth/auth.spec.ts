import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../../environments/environment'
import { HttpAuthApi } from './auth'

describe('HttpAuthApi', () => {
	let api: HttpAuthApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
		api = TestBed.inject(HttpAuthApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('posts the Auth0 profile to /users/authenticate wrapped in a `user` field', () => {
		const profile = { email: 'jdoe@brillante.test', name: 'Jane Doe' }
		const response = { id: 1, email: 'jdoe@brillante.test', token: 'jwt' }
		let result: unknown

		api.authenticate(profile).subscribe((value) => (result = value))

		const req = httpMock.expectOne(`${environment.apiUrl}/users/authenticate`)
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual({ user: profile })
		req.flush(response)
		expect(result).toEqual(response)
	})
})
