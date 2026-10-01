import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { AuthSession } from '@providers/auth/auth-session'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { IdentityApi } from '@providers/identity/identity.interface'
import { InMemoryIdentityApi } from '@providers/identity/identity.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { environment } from '../environments/environment'
import { unauthorizedInterceptor } from './unauthorized.interceptor'

describe('unauthorizedInterceptor', () => {
	let http: HttpClient
	let httpMock: HttpTestingController
	let identityApi: InMemoryIdentityApi

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
		identityApi = new InMemoryIdentityApi()

		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([unauthorizedInterceptor])),
				provideHttpClientTesting(),
				{ provide: IdentityApi, useValue: identityApi },
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
			],
		})

		http = TestBed.inject(HttpClient)
		httpMock = TestBed.inject(HttpTestingController)
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
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('signs the user out when the Brillante API answers 401', () => {
		let failure: unknown
		http.get(`${environment.apiUrl}/repair`).subscribe({ error: (error: unknown) => (failure = error) })

		httpMock
			.expectOne(`${environment.apiUrl}/repair`)
			.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' })

		expect(TestBed.inject(AuthStore).currentUser()).toBeNull()
		expect(TestBed.inject(AuthSession).read()).toBeNull()
		expect(identityApi.logouts).toBe(1)
		expect(failure).toBeTruthy()
	})

	it('keeps the session on other API errors', () => {
		http.get(`${environment.apiUrl}/repair`).subscribe({ error: () => undefined })

		httpMock.expectOne(`${environment.apiUrl}/repair`).flush('boom', { status: 500, statusText: 'Server Error' })

		expect(TestBed.inject(AuthSession).read()).not.toBeNull()
		expect(identityApi.logouts).toBe(0)
	})

	it('ignores 401 answers from other hosts', () => {
		http.get('https://example.com/data').subscribe({ error: () => undefined })

		httpMock.expectOne('https://example.com/data').flush('nope', { status: 401, statusText: 'Unauthorized' })

		expect(TestBed.inject(AuthSession).read()).not.toBeNull()
	})
})
