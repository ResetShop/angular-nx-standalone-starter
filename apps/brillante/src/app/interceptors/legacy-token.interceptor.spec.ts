import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../environments/environment'
import { legacyTokenInterceptor } from './legacy-token.interceptor'

describe('legacyTokenInterceptor', () => {
	let http: HttpClient
	let httpMock: HttpTestingController
	let authApi: InMemoryAuthApi
	let issued: number

	beforeEach(() => {
		clearAllMocks()
		authApi = new InMemoryAuthApi()
		issued = 0
		authApi.getLegacyToken = () => {
			issued++
			return new InMemoryAuthApi().getLegacyToken()
		}
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([legacyTokenInterceptor])),
				provideHttpClientTesting(),
				{ provide: AuthApi, useValue: authApi },
			],
		})
		http = TestBed.inject(HttpClient)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('sends requests to the legacy API with the token issued for the signed-in user', () => {
		http.get(`${environment.apiUrl}/repair`).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/repair`)
		expect(req.request.headers.get('Authorization')).toBe('Bearer mock.legacy.token')
		req.flush([])
	})

	it('does not ask for a token or add one for the app’s own backend or third parties', () => {
		http.get('/api/auth/me').subscribe()
		http.get('https://example.com/data').subscribe()

		expect(httpMock.expectOne('/api/auth/me').request.headers.has('Authorization')).toBe(false)
		expect(httpMock.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(false)
		expect(issued).toBe(0)
	})

	it('retries once with a fresh token when the legacy API answers 401', () => {
		let result: unknown
		http.get(`${environment.apiUrl}/repair`).subscribe((value) => (result = value))

		httpMock.expectOne(`${environment.apiUrl}/repair`).flush(null, { status: 401, statusText: 'Unauthorized' })
		httpMock.expectOne(`${environment.apiUrl}/repair`).flush(['ok'])

		expect(result).toEqual(['ok'])
		expect(issued).toBe(2)
	})

	it('gives up after the retry and reports the second 401', () => {
		let error: HttpErrorResponse | undefined
		http.get(`${environment.apiUrl}/repair`).subscribe({ error: (e) => (error = e) })

		httpMock.expectOne(`${environment.apiUrl}/repair`).flush(null, { status: 401, statusText: 'Unauthorized' })
		httpMock.expectOne(`${environment.apiUrl}/repair`).flush(null, { status: 401, statusText: 'Unauthorized' })

		expect(error?.status).toBe(401)
	})

	it('does not retry other errors', () => {
		let error: HttpErrorResponse | undefined
		http.get(`${environment.apiUrl}/repair`).subscribe({ error: (e) => (error = e) })

		httpMock.expectOne(`${environment.apiUrl}/repair`).flush(null, { status: 500, statusText: 'Server Error' })

		expect(error?.status).toBe(500)
		expect(issued).toBe(1)
	})
})
