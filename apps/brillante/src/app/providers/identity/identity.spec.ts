import { TestBed } from '@angular/core/testing'
import { AuthService } from '@auth0/auth0-angular'
import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { firstValueFrom, of, Subject } from 'rxjs'
import { Auth0IdentityApi } from './identity'

describe('Auth0IdentityApi', () => {
	const isLoading$ = new Subject<boolean>()
	const user$ = new Subject<{ email: string } | null | undefined>()
	const loginWithRedirect = fn()
	const logout = fn()

	beforeEach(() => {
		clearAllMocks()
		loginWithRedirect.mockReturnValue(of(undefined))
		logout.mockReturnValue(of(undefined))

		TestBed.configureTestingModule({
			providers: [{ provide: AuthService, useValue: { isLoading$, user$, loginWithRedirect, logout } }],
		})
	})

	it('waits for Auth0 to finish loading before reading the profile', async () => {
		const profile = firstValueFrom(TestBed.inject(Auth0IdentityApi).getProfile())

		isLoading$.next(true)
		isLoading$.next(false)
		user$.next({ email: 'jdoe@brillante.test' })

		expect(await profile).toEqual({ email: 'jdoe@brillante.test' })
	})

	it('reports a signed-out visitor as a null profile', async () => {
		const profile = firstValueFrom(TestBed.inject(Auth0IdentityApi).getProfile())

		isLoading$.next(false)
		user$.next(undefined)

		expect(await profile).toBeNull()
	})

	it('redirects to the Auth0 login page returning to the application origin', async () => {
		await firstValueFrom(TestBed.inject(Auth0IdentityApi).loginWithRedirect())

		expect(loginWithRedirect.calls[0][0]).toEqual({
			authorizationParams: { redirect_uri: window.location.origin },
		})
	})

	it('ends the federated Auth0 session on logout', async () => {
		await firstValueFrom(TestBed.inject(Auth0IdentityApi).logout())

		expect(logout.calls[0][0]).toEqual({
			logoutParams: { federated: true, returnTo: window.location.origin },
		})
	})
})
