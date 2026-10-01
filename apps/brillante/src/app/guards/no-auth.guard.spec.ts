import { TestBed } from '@angular/core/testing'
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { provideRouter, UrlTree } from '@angular/router'
import { AuthSession } from '@providers/auth/auth-session'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { IdentityApi } from '@providers/identity/identity.interface'
import { InMemoryIdentityApi } from '@providers/identity/identity.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { noAuthGuard } from './no-auth.guard'

describe('noAuthGuard', () => {
	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()

		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				{ provide: IdentityApi, useValue: new InMemoryIdentityApi() },
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
			],
		})
	})

	function runGuard(): boolean | UrlTree {
		return TestBed.runInInjectionContext(() => noAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as
			boolean | UrlTree
	}

	it('lets anonymous visitors reach the login page', () => {
		expect(runGuard()).toBe(true)
	})

	it('sends a signed-in user to the dashboard', () => {
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

		const result = runGuard()

		expect(result).toBeInstanceOf(UrlTree)
		expect((result as UrlTree).toString()).toBe('/dashboard')
	})
})
