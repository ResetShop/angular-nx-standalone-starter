import { TestBed } from '@angular/core/testing'
import type { LoginResponse, MeResponse, RefreshResponse } from '@contracts/auth/auth.types'
import type { IPermission } from '@domain/access/permission.interface'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { clearAllMocks, fn, type MockFn } from '@test-utils'
import { firstValueFrom, NEVER, of, throwError, type Observable } from 'rxjs'
import { AuthStore } from './auth.store'

describe('AuthStore', () => {
	let store: InstanceType<typeof AuthStore>
	let authApiMock: {
		login: MockFn<[{ email: string; password: string }], Observable<LoginResponse>>
		logout: MockFn<[], Observable<void>>
		refreshToken: MockFn<[], Observable<RefreshResponse>>
		getMe: MockFn<[], Observable<MeResponse>>
	}

	const mockLoginResponse: LoginResponse = {
		user: {
			id: 1,
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
		},
		mustChangePassword: false,
	}

	const mockMeResponse: MeResponse = {
		id: 1,
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		roles: [],
	}

	beforeEach(() => {
		clearAllMocks()

		authApiMock = {
			login: fn(),
			logout: fn(),
			refreshToken: fn(),
			getMe: fn(),
		}

		authApiMock.getMe.mockReturnValue(throwError(() => new Error('No session')))

		TestBed.configureTestingModule({
			providers: [AuthStore, { provide: AuthApi, useValue: authApiMock }],
		})

		store = TestBed.inject(AuthStore)
	})

	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(store.currentUser()).toBeNull()
			expect(store.isTokenRefreshing()).toBe(false)
			expect(store.isLoggingIn()).toBe(false)
			expect(store.isLoggingOut()).toBe(false)
			expect(store.loginError()).toBeNull()
			expect(store.mustChangePassword()).toBe(false)
		})

		it('should have correct computed signals', () => {
			expect(store.isAuthenticated()).toBe(false)
			expect(store.userPermissions()).toEqual([])
			expect(store.userRoles()).toEqual([])
		})
	})

	describe('login', () => {
		it('should set isLoggingIn to true when login starts', () => {
			authApiMock.login.mockReturnValue(NEVER)
			store.login({ email: 'test@example.com', password: 'password' })

			expect(store.isLoggingIn()).toBe(true)
		})

		it('should update state on successful login', () => {
			authApiMock.login.mockReturnValue(of(mockLoginResponse))

			store.login({ email: 'test@example.com', password: 'password' })

			expect(store.currentUser()).toBeTruthy()
			expect(store.currentUser()?.email).toBe('test@example.com')
			expect(store.isLoggingIn()).toBe(false)
			expect(store.loginError()).toBeNull()
			expect(store.mustChangePassword()).toBe(false)
		})

		it('should set mustChangePassword when login response requires password change', () => {
			authApiMock.login.mockReturnValue(of({ ...mockLoginResponse, mustChangePassword: true }))

			store.login({ email: 'test@example.com', password: 'password' })

			expect(store.mustChangePassword()).toBe(true)
		})

		it('should set loginError on failed login', () => {
			const errorResponse = { error: { code: 'INVALID_CREDENTIALS' } }
			authApiMock.login.mockReturnValue(throwError(() => errorResponse))

			store.login({ email: 'test@example.com', password: 'wrong' })

			expect(store.isLoggingIn()).toBe(false)
			expect(store.loginError()).toEqual({ code: 'INVALID_CREDENTIALS' })
			expect(store.currentUser()).toBeNull()
		})
	})

	describe('logout', () => {
		beforeEach(() => {
			store.updateCurrentUser(createMockUser())
		})

		it('should clear current user and mustChangePassword immediately', () => {
			authApiMock.logout.mockReturnValue(of(undefined))

			store.logout()

			expect(store.currentUser()).toBeNull()
			expect(store.mustChangePassword()).toBe(false)
		})

		it('should set isLoggingOut to true', () => {
			authApiMock.logout.mockReturnValue(NEVER)

			store.logout()

			expect(store.isLoggingOut()).toBe(true)
		})

		it('should set isLoggingOut to false on success', () => {
			authApiMock.logout.mockReturnValue(of(undefined))

			store.logout()

			expect(store.isLoggingOut()).toBe(false)
		})

		it('should set isLoggingOut to false on error', () => {
			authApiMock.logout.mockReturnValue(throwError(() => new Error('Network error')))

			store.logout()

			expect(store.isLoggingOut()).toBe(false)
		})
	})

	describe('refreshToken', () => {
		it('should return the API response observable', () => {
			const mockRefreshResponse: RefreshResponse = {}
			authApiMock.refreshToken.mockReturnValue(of(mockRefreshResponse))

			let emitted = false
			store.refreshToken().subscribe(() => {
				emitted = true
			})

			expect(emitted).toBe(true)
		})
	})

	describe('validateSession', () => {
		it('should call getMe and update currentUser on success', async () => {
			authApiMock.getMe.mockReturnValue(of(mockMeResponse))

			const emittedUser = await firstValueFrom(store.validateSession())

			expect(store.currentUser()?.email).toBe('test@example.com')
			expect(emittedUser.email).toBe('test@example.com')
		})

		it('should propagate errors without catching', async () => {
			const testError = new Error('Unauthorized')
			authApiMock.getMe.mockReturnValue(throwError(() => testError))

			await expect(firstValueFrom(store.validateSession())).rejects.toBe(testError)
		})
	})

	describe('computed signals', () => {
		it('should compute isAuthenticated based on currentUser', () => {
			expect(store.isAuthenticated()).toBe(false)

			store.updateCurrentUser(createMockUser())

			expect(store.isAuthenticated()).toBe(true)
		})

		it('should compute userPermissions from currentUser', () => {
			const mockPermission: IPermission = {
				id: 1,
				resource: 'users',
				name: 'users:read',
				description: 'Read users',
				action: 'read',
				identifier: 'users:read',
				matches: () => true,
			}

			store.updateCurrentUser(createMockUser({ permissions: [mockPermission] }))

			expect(store.userPermissions()).toEqual([mockPermission])
		})
	})

	describe('token refresh state management', () => {
		it('should manage token refreshing flag', () => {
			expect(store.isTokenRefreshing()).toBe(false)

			store.startTokenRefresh()
			expect(store.isTokenRefreshing()).toBe(true)

			store.completeTokenRefresh()
			expect(store.isTokenRefreshing()).toBe(false)
		})

		it('should reset refresh state on failTokenRefresh', () => {
			store.startTokenRefresh()
			expect(store.isTokenRefreshing()).toBe(true)

			store.failTokenRefresh()
			expect(store.isTokenRefreshing()).toBe(false)
		})
	})
})
