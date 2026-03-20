import { TestBed } from '@angular/core/testing'
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { provideRouter, UrlTree } from '@angular/router'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { AuthStore } from '@store/auth/auth.store'
import { clearAllMocks } from '@test-utils'
import { permissionGuard } from './permission.guard'

describe('permissionGuard', () => {
	beforeEach(() => {
		clearAllMocks()

		TestBed.configureTestingModule({
			providers: [AuthStore, provideRouter([]), { provide: AuthApi, useValue: new InMemoryAuthApi() }],
		})
	})

	function runGuard(requiredPermission?: string): boolean | UrlTree {
		const route = { data: { requiredPermission } } as unknown as ActivatedRouteSnapshot
		return TestBed.runInInjectionContext(() => permissionGuard(route, {} as RouterStateSnapshot)) as boolean | UrlTree
	}

	it('should allow navigation when no permission is required', () => {
		const result = runGuard(undefined)

		expect(result).toBe(true)
	})

	it('should allow navigation when user has the required permission', () => {
		const store = TestBed.inject(AuthStore)
		store.updateCurrentUser(
			createMockUser({
				hasPermissionByIdentifier: (id: string) => id === 'admin:users:read',
			}),
		)

		const result = runGuard('admin:users:read')

		expect(result).toBe(true)
	})

	it('should redirect to /dashboard when user lacks the required permission', () => {
		const store = TestBed.inject(AuthStore)
		store.updateCurrentUser(createMockUser())

		const result = runGuard('admin:users:read')

		expect(result).toBeInstanceOf(UrlTree)
		expect((result as UrlTree).toString()).toBe('/dashboard')
	})

	it('should redirect to /dashboard when user is null', () => {
		const result = runGuard('admin:users:read')

		expect(result).toBeInstanceOf(UrlTree)
		expect((result as UrlTree).toString()).toBe('/dashboard')
	})
})
