import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { environment } from '../environments/environment'
import { authInterceptor } from './auth.interceptor'
import { legacyTokenInterceptor } from './legacy-token.interceptor'
import { tokenRefreshInterceptor } from './token-refresh.interceptor'

/**
 * The three session interceptors in the order `app.config.ts` registers them: the app's own `/api` requests carry the
 * cookie and are refreshed on a 401, the legacy API gets a bearer token and neither of those.
 */
describe('session interceptors together', () => {
	let http: HttpClient
	let httpMock: HttpTestingController

	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([authInterceptor, legacyTokenInterceptor, tokenRefreshInterceptor])),
				provideHttpClientTesting(),
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
			],
		})
		http = TestBed.inject(HttpClient)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('sends a legacy request with the bearer token and without the cookie', () => {
		http.get(`${environment.apiUrl}/repair`).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/repair`)
		expect(req.request.headers.get('Authorization')).toBe('Bearer mock.legacy.token')
		expect(req.request.withCredentials).toBe(false)
		req.flush([])
	})

	it('sends an own-backend request with the cookie and without a bearer token', () => {
		http.get('/api/auth/me').subscribe()

		const req = httpMock.expectOne('/api/auth/me')
		expect(req.request.withCredentials).toBe(true)
		expect(req.request.headers.has('Authorization')).toBe(false)
		req.flush({})
	})

	it('does not end the session when the legacy API refuses the token twice', () => {
		const authStore = TestBed.inject(AuthStore)
		authStore.updateCurrentUser(createMockUser())
		http.get(`${environment.apiUrl}/repair`).subscribe({ error: () => undefined })

		httpMock.expectOne(`${environment.apiUrl}/repair`).flush(null, { status: 401, statusText: 'Unauthorized' })
		httpMock.expectOne(`${environment.apiUrl}/repair`).flush(null, { status: 401, statusText: 'Unauthorized' })

		expect(authStore.currentUser()).not.toBeNull()
	})
})
