import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { AuthSession } from '@providers/auth/auth-session'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../environments/environment'
import { jwtInterceptor } from './jwt.interceptor'

describe('jwtInterceptor', () => {
	let http: HttpClient
	let httpMock: HttpTestingController

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()

		TestBed.configureTestingModule({
			providers: [provideHttpClient(withInterceptors([jwtInterceptor])), provideHttpClientTesting()],
		})

		http = TestBed.inject(HttpClient)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	function signIn(): void {
		TestBed.inject(AuthSession).write({
			id: 1,
			userName: 'jdoe',
			firstName: 'Jane',
			lastName: 'Doe',
			avatar: null,
			email: 'jdoe@brillante.test',
			roles: [],
			hasFinishedRegistration: true,
			token: 'jwt-token',
		})
	}

	it('adds the Bearer token to requests sent to the Brillante API', () => {
		signIn()

		http.get(`${environment.apiUrl}/repair`).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/repair`)
		expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token')
		req.flush([])
	})

	it('does not send the token to third-party hosts', () => {
		signIn()

		http.get('https://example.com/data').subscribe()

		const req = httpMock.expectOne('https://example.com/data')
		expect(req.request.headers.has('Authorization')).toBe(false)
		req.flush({})
	})

	it('sends API requests untouched while signed out', () => {
		http.get(`${environment.apiUrl}/repair/getStatusData`).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/repair/getStatusData`)
		expect(req.request.headers.has('Authorization')).toBe(false)
		req.flush([])
	})
})
