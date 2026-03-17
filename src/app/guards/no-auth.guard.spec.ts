import { TestBed } from '@angular/core/testing'
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { provideRouter, UrlTree } from '@angular/router'
import { createAuthApiMock } from '@mocks/auth-api.mock'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { AuthStore } from '@store/auth/auth.store'
import { clearAllMocks } from '@test-utils'
import type { Observable } from 'rxjs'
import { firstValueFrom, of, throwError } from 'rxjs'
import { noAuthGuard } from './no-auth.guard'

describe('noAuthGuard', () => {
	let authApiMock: ReturnType<typeof createAuthApiMock>

	// validateSession() always returns an Observable, never a synchronous value
	function runGuard(): Observable<boolean | UrlTree> {
		return TestBed.runInInjectionContext(() =>
			noAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
		) as Observable<boolean | UrlTree>
	}

	beforeEach(() => {
		clearAllMocks()

		authApiMock = createAuthApiMock()
		authApiMock.getMe.mockReturnValue(throwError(() => new Error('No session')))

		TestBed.configureTestingModule({
			providers: [AuthStore, provideRouter([]), { provide: AuthApi, useValue: authApiMock }],
		})
	})

	it('should return true when user is not authenticated', async () => {
		// getMe is configured to throw in beforeEach — no additional setup needed
		const result = await firstValueFrom(runGuard())

		expect(result).toBe(true)
	})

	it('should redirect to /dashboard when user is authenticated', async () => {
		authApiMock.getMe.mockReturnValue(
			of({
				id: 1,
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				roles: [],
			}),
		)

		const result = await firstValueFrom(runGuard())

		expect(result).toBeInstanceOf(UrlTree)
		expect((result as UrlTree).toString()).toBe('/dashboard')
	})

	it('should update currentUser with fresh data from /me response', async () => {
		authApiMock.getMe.mockReturnValue(
			of({
				id: 1,
				email: 'updated@example.com',
				firstName: 'Updated',
				lastName: 'User',
				roles: [],
			}),
		)

		const store = TestBed.inject(AuthStore)
		await firstValueFrom(runGuard())

		expect(store.currentUser()?.email).toBe('updated@example.com')
		expect(store.currentUser()?.firstName).toBe('Updated')
	})

	it('should not clear a stale currentUser when session validation fails', async () => {
		const store = TestBed.inject(AuthStore)
		store.updateCurrentUser(createMockUser({ email: 'stale@example.com' }))

		// getMe is configured to throw in beforeEach — no additional setup needed
		await firstValueFrom(runGuard())

		// validateSession does not clear currentUser on error — the guard redirects instead
		expect(store.currentUser()?.email).toBe('stale@example.com')
	})
})
