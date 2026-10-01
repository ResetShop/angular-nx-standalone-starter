import { TestBed } from '@angular/core/testing'
import type { AuthenticatedUserDto } from '@contracts/user/user.types'
import { AuthSession } from '@providers/auth/auth-session'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { IdentityApi } from '@providers/identity/identity.interface'
import { InMemoryIdentityApi } from '@providers/identity/identity.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { AuthStore } from './auth.store'

function buildSession(overrides: Partial<AuthenticatedUserDto> = {}): AuthenticatedUserDto {
	return {
		id: 7,
		userName: 'clerk',
		firstName: 'Clara',
		lastName: 'Clerk',
		avatar: null,
		email: 'clara@brillante.test',
		roles: [{ id: 3, description: 'Counter clerk' }],
		hasFinishedRegistration: true,
		token: 'jwt-token',
		...overrides,
	}
}

describe('AuthStore', () => {
	let authApi: InMemoryAuthApi
	let identityApi: InMemoryIdentityApi

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
		authApi = new InMemoryAuthApi()
		identityApi = new InMemoryIdentityApi()

		TestBed.configureTestingModule({
			providers: [
				{ provide: AuthApi, useValue: authApi },
				{ provide: IdentityApi, useValue: identityApi },
			],
		})
	})

	describe('session restore', () => {
		it('starts signed out when there is no persisted session', () => {
			const store = TestBed.inject(AuthStore)

			expect(store.currentUser()).toBeNull()
			expect(store.isAuthenticated()).toBe(false)
		})

		it('restores the persisted session without contacting the backend', () => {
			TestBed.inject(AuthSession).write(buildSession())

			const store = TestBed.inject(AuthStore)

			expect(store.currentUser()?.email).toBe('clara@brillante.test')
			expect(store.isAuthenticated()).toBe(true)
		})
	})

	describe('login', () => {
		it('exchanges the Auth0 profile for a session and persists it', () => {
			identityApi.profile = { email: 'clara@brillante.test', name: 'Clara Clerk' }
			authApi.setResponse(buildSession())
			const store = TestBed.inject(AuthStore)

			store.login()

			expect(store.currentUser()?.fullName).toBe('Clara Clerk')
			expect(store.isLoggingIn()).toBe(false)
			expect(TestBed.inject(AuthSession).token).toBe('jwt-token')
		})

		it('derives permissions from the roles of the authenticated user', () => {
			identityApi.profile = { email: 'clara@brillante.test' }
			authApi.setResponse(buildSession())
			const store = TestBed.inject(AuthStore)

			store.login()

			expect(store.userPermissions()).toContain('cash:transaction:manage')
			expect(store.userPermissions()).not.toContain('reports:cash:read')
		})

		it('leaves the user signed out when Auth0 has no active session', () => {
			identityApi.profile = null
			const store = TestBed.inject(AuthStore)

			store.login()

			expect(store.currentUser()).toBeNull()
			expect(store.isLoggingIn()).toBe(false)
			expect(store.loginError()).toBeNull()
		})

		it('records a login error when the backend rejects the profile', () => {
			identityApi.profile = { email: 'ghost@brillante.test' }
			authApi.setError('authenticate', new Error('unknown user'))
			const store = TestBed.inject(AuthStore)

			store.login()

			expect(store.currentUser()).toBeNull()
			expect(store.isLoggingIn()).toBe(false)
			expect(store.loginError()).toBe('LOGIN_FAILED')
		})
	})

	describe('redirectToLogin', () => {
		it('sends the browser to the identity provider', () => {
			const store = TestBed.inject(AuthStore)

			store.redirectToLogin()

			expect(identityApi.loginRedirects).toBe(1)
		})
	})

	describe('logout', () => {
		it('clears the persisted session, the user and ends the identity session', () => {
			TestBed.inject(AuthSession).write(buildSession())
			const store = TestBed.inject(AuthStore)

			store.logout()

			expect(store.currentUser()).toBeNull()
			expect(TestBed.inject(AuthSession).read()).toBeNull()
			expect(identityApi.logouts).toBe(1)
			expect(store.isLoggingOut()).toBe(false)
		})
	})

	describe('updateCurrentUser', () => {
		it('replaces the signed-in user', () => {
			TestBed.inject(AuthSession).write(buildSession())
			const store = TestBed.inject(AuthStore)
			const current = store.currentUser()
			if (!current) throw new Error('expected a restored user')

			store.updateCurrentUser({ ...current, firstName: 'Renamed', fullName: 'Renamed Clerk' })

			expect(store.currentUser()?.fullName).toBe('Renamed Clerk')
		})
	})
})
