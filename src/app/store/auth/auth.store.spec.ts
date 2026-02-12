import { TestBed } from '@angular/core/testing';
import type { LoginResponse, RefreshResponse } from '@contracts/auth/auth.types';
import type { IPermission } from '@domain/access/permission.interface';
import { createMockUser } from '@mocks/user.mock';
import { AuthApiService } from '@providers/auth/auth';
import { clearAllMocks, fn, type MockFn } from '@test-utils';
import { firstValueFrom, NEVER, of, throwError, type Observable } from 'rxjs';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
	let store: InstanceType<typeof AuthStore>;
	let authApiMock: {
		login: MockFn<[{ email: string; password: string }], Observable<LoginResponse>>;
		logout: MockFn<[], Observable<void>>;
		refreshToken: MockFn<[], Observable<RefreshResponse>>;
		getMe: MockFn<[], Observable<unknown>>;
	};

	const mockLoginResponse: LoginResponse = {
		user: {
			id: 1,
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
		},
		token: 'mock-token',
	};

	const mockRefreshResponse: RefreshResponse = {
		token: 'new-mock-token',
	};

	beforeEach(() => {
		clearAllMocks();

		authApiMock = {
			login: fn(),
			logout: fn(),
			refreshToken: fn(),
			getMe: fn(),
		};

		TestBed.configureTestingModule({
			providers: [AuthStore, { provide: AuthApiService, useValue: authApiMock }],
		});

		store = TestBed.inject(AuthStore);

		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(store.currentUser()).toBeNull();
			expect(store.isInitialized()).toBe(true);
			expect(store.isTokenRefreshing()).toBe(false);
			expect(store.isLoggingIn()).toBe(false);
			expect(store.isLoggingOut()).toBe(false);
			expect(store.loginError()).toBeNull();
			expect(store.pendingRefreshToken()).toBeNull();
		});

		it('should have correct computed signals', () => {
			expect(store.isAuthenticated()).toBe(false);
			expect(store.userPermissions()).toEqual([]);
			expect(store.userRoles()).toEqual([]);
		});

		it('should auto-initialize from localStorage on creation', () => {
			const validData = {
				id: 1,
				email: 'auto@example.com',
				firstName: 'Auto',
				lastName: 'User',
				roles: [],
				token: 'auto-token',
			};
			localStorage.setItem('auth_user', JSON.stringify(validData));

			TestBed.resetTestingModule();
			TestBed.configureTestingModule({
				providers: [AuthStore, { provide: AuthApiService, useValue: authApiMock }],
			});

			const freshStore = TestBed.inject(AuthStore);

			expect(freshStore.isInitialized()).toBe(true);
			expect(freshStore.currentUser()?.email).toBe('auto@example.com');
		});
	});

	describe('login', () => {
		it('should set isLoggingIn to true when login starts', () => {
			authApiMock.login.mockReturnValue(NEVER);
			store.login({ email: 'test@example.com', password: 'password' });

			expect(store.isLoggingIn()).toBe(true);
		});

		it('should update state on successful login', () => {
			authApiMock.login.mockReturnValue(of(mockLoginResponse));

			store.login({ email: 'test@example.com', password: 'password' });

			expect(store.currentUser()).toBeTruthy();
			expect(store.currentUser()?.email).toBe('test@example.com');
			expect(store.isLoggingIn()).toBe(false);
			expect(store.loginError()).toBeNull();
		});

		it('should persist user to localStorage on successful login', () => {
			authApiMock.login.mockReturnValue(of(mockLoginResponse));

			store.login({ email: 'test@example.com', password: 'password' });

			const stored = localStorage.getItem('auth_user');
			expect(stored).toBeTruthy();
			const parsed = JSON.parse(stored as string);
			expect(parsed.email).toBe('test@example.com');
		});

		it('should set loginError on failed login', () => {
			const errorResponse = { error: { code: 'INVALID_CREDENTIALS' } };
			authApiMock.login.mockReturnValue(throwError(() => errorResponse));

			store.login({ email: 'test@example.com', password: 'wrong' });

			expect(store.isLoggingIn()).toBe(false);
			expect(store.loginError()).toEqual({ code: 'INVALID_CREDENTIALS' });
			expect(store.currentUser()).toBeNull();
		});
	});

	describe('logout', () => {
		beforeEach(() => {
			store.updateCurrentUser(createMockUser());
		});

		it('should clear current user immediately', () => {
			authApiMock.logout.mockReturnValue(of(undefined));

			store.logout();

			expect(store.currentUser()).toBeNull();
		});

		it('should set isLoggingOut to true', () => {
			authApiMock.logout.mockReturnValue(NEVER);

			store.logout();

			expect(store.isLoggingOut()).toBe(true);
		});

		it('should clear localStorage', () => {
			authApiMock.logout.mockReturnValue(of(undefined));
			localStorage.setItem('auth_user', '{"email":"test"}');

			store.logout();

			expect(localStorage.getItem('auth_user')).toBeNull();
		});

		it('should set isLoggingOut to false on success', () => {
			authApiMock.logout.mockReturnValue(of(undefined));

			store.logout();

			expect(store.isLoggingOut()).toBe(false);
		});

		it('should set isLoggingOut to false on error', () => {
			authApiMock.logout.mockReturnValue(throwError(() => new Error('Network error')));

			store.logout();

			expect(store.isLoggingOut()).toBe(false);
		});
	});

	describe('refreshToken', () => {
		beforeEach(() => {
			store.updateCurrentUser(createMockUser({ token: 'old-token' }));
		});

		it('should update user token on successful refresh', () => {
			authApiMock.refreshToken.mockReturnValue(of(mockRefreshResponse));

			store.refreshToken().subscribe();

			expect(store.currentUser()?.token).toBe('new-mock-token');
		});

		it('should update pendingRefreshToken for interceptor coordination', () => {
			authApiMock.refreshToken.mockReturnValue(of(mockRefreshResponse));

			store.refreshToken().subscribe();

			expect(store.pendingRefreshToken()).toBe('new-mock-token');
		});

		it('should persist updated user to localStorage', () => {
			authApiMock.refreshToken.mockReturnValue(of(mockRefreshResponse));

			store.refreshToken().subscribe();

			const stored = localStorage.getItem('auth_user');
			const parsed = JSON.parse(stored as string);
			expect(parsed.token).toBe('new-mock-token');
		});
	});

	describe('restoreFromStorage', () => {
		it('should restore user from valid localStorage data', () => {
			const validData = {
				id: 1,
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				roles: [],
				token: 'stored-token',
			};
			localStorage.setItem('auth_user', JSON.stringify(validData));

			store.restoreFromStorage();

			expect(store.currentUser()).toBeTruthy();
			expect(store.currentUser()?.email).toBe('test@example.com');
			expect(store.isInitialized()).toBe(true);
		});

		it('should clear invalid localStorage data', () => {
			localStorage.setItem('auth_user', 'invalid-json');

			store.restoreFromStorage();

			expect(store.currentUser()).toBeNull();
			expect(localStorage.getItem('auth_user')).toBeNull();
		});

		it('should handle missing localStorage data', () => {
			store.restoreFromStorage();

			expect(store.currentUser()).toBeNull();
			expect(store.isInitialized()).toBe(true);
		});
	});

	describe('computed signals', () => {
		it('should compute isAuthenticated based on currentUser', () => {
			expect(store.isAuthenticated()).toBe(false);

			store.updateCurrentUser(createMockUser());

			expect(store.isAuthenticated()).toBe(true);
		});

		it('should compute userPermissions from currentUser', () => {
			const mockPermission: IPermission = {
				id: 1,
				resource: 'users',
				name: 'users:read',
				description: 'Read users',
				action: 'read',
				identifier: 'users:read',
				matches: () => true,
			};

			store.updateCurrentUser(createMockUser({ permissions: [mockPermission] }));

			expect(store.userPermissions()).toEqual([mockPermission]);
		});
	});

	describe('state management methods', () => {
		it('should update token refreshing status', () => {
			expect(store.isTokenRefreshing()).toBe(false);

			store.setTokenRefreshing(true);

			expect(store.isTokenRefreshing()).toBe(true);
		});

		it('should clear pending refresh token', () => {
			store.updateCurrentUser(createMockUser({ token: 'old-token' }));
			authApiMock.refreshToken.mockReturnValue(of(mockRefreshResponse));

			store.refreshToken().subscribe();
			expect(store.pendingRefreshToken()).toBe('new-mock-token');

			store.clearPendingRefreshToken();

			expect(store.pendingRefreshToken()).toBeNull();
		});

		it('should atomically reset refresh state on failTokenRefresh', () => {
			store.updateCurrentUser(createMockUser({ token: 'old-token' }));
			authApiMock.refreshToken.mockReturnValue(of(mockRefreshResponse));

			store.startTokenRefresh();
			store.refreshToken().subscribe();
			expect(store.pendingRefreshToken()).toBe('new-mock-token');
			expect(store.isTokenRefreshing()).toBe(true);

			store.failTokenRefresh();

			expect(store.isTokenRefreshing()).toBe(false);
			expect(store.pendingRefreshToken()).toBeNull();
		});
	});

	describe('getPendingRefreshToken$', () => {
		it('should return observable of pendingRefreshToken signal', async () => {
			const token = await TestBed.runInInjectionContext(() => firstValueFrom(store.getPendingRefreshToken$()));

			expect(token).toBeNull();
		});
	});
});
