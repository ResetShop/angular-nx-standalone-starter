import { TestBed } from '@angular/core/testing'
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { provideRouter, UrlTree } from '@angular/router'
import type { AuthenticatedUserDto } from '@contracts/user/legacy-user.types'
import { AuthSession } from '@providers/auth/auth-session'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { IdentityApi } from '@providers/identity/identity.interface'
import { InMemoryIdentityApi } from '@providers/identity/identity.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { firstValueFrom, isObservable, type Observable } from 'rxjs'
import { authGuard } from './auth.guard'

const session: AuthenticatedUserDto = {
	id: 1,
	userName: 'jdoe',
	firstName: 'Jane',
	lastName: 'Doe',
	avatar: null,
	email: 'jdoe@brillante.test',
	roles: [{ id: 3, description: 'Counter clerk' }],
	hasFinishedRegistration: true,
	token: 'jwt-token',
}

describe('authGuard', () => {
	let identityApi: InMemoryIdentityApi
	let authApi: InMemoryAuthApi

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
		identityApi = new InMemoryIdentityApi()
		authApi = new InMemoryAuthApi()

		TestBed.configureTestingModule({
			providers: [
				provideRouter([]),
				{ provide: IdentityApi, useValue: identityApi },
				{ provide: AuthApi, useValue: authApi },
			],
		})
	})

	function runGuard(): boolean | UrlTree | Observable<boolean | UrlTree> {
		return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as
			boolean | UrlTree | Observable<boolean | UrlTree>
	}

	it('lets a signed-in user through without asking the identity provider', () => {
		TestBed.inject(AuthSession).write(session)

		expect(runGuard()).toBe(true)
		expect(identityApi.loginRedirects).toBe(0)
	})

	it('signs the user in when Auth0 holds an active session', async () => {
		identityApi.profile = { email: 'jdoe@brillante.test' }
		authApi.setResponse(session)

		const result = runGuard()

		expect(isObservable(result)).toBe(true)
		expect(await firstValueFrom(result as Observable<boolean | UrlTree>)).toBe(true)
		expect(TestBed.inject(AuthStore).currentUser()?.email).toBe('jdoe@brillante.test')
	})

	it('redirects to the login page when there is no session anywhere', async () => {
		identityApi.profile = null

		const result = await firstValueFrom(runGuard() as Observable<boolean | UrlTree>)

		expect(result).toBeInstanceOf(UrlTree)
		expect((result as UrlTree).toString()).toBe('/auth/login')
	})

	it('redirects to the login page when the backend rejects the Auth0 profile', async () => {
		identityApi.profile = { email: 'ghost@brillante.test' }
		authApi.setError('authenticate', new Error('unknown user'))

		const result = await firstValueFrom(runGuard() as Observable<boolean | UrlTree>)

		expect((result as UrlTree).toString()).toBe('/auth/login')
	})
})
