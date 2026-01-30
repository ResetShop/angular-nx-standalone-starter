import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import type { LoginResponse, RefreshResponse } from '@contracts/auth/auth.types';
import type { IUser } from '@domain/user/user.interface';
import { AuthApiService } from '@providers/auth/auth';
import { of, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
	let store: InstanceType<typeof AuthStore>;
	let authApiService: jasmine.SpyObj<AuthApiService>;
	let router: jasmine.SpyObj<Router>;

	const mockLoginResponse: LoginResponse = {
		user: {
			id: 1,
			email: 'test@example.com',
			firstName: 'Test',
			lastName: 'User',
			roles: [],
		},
		token: 'mock-token',
	};

	const mockRefreshResponse: RefreshResponse = {
		token: 'new-mock-token',
	};

	beforeEach(() => {
		const authApiSpy = jasmine.createSpyObj('AuthApiService', ['login', 'logout', 'refreshToken', 'getMe']);
		const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

		TestBed.configureTestingModule({
			providers: [
				AuthStore,
				{ provide: AuthApiService, useValue: authApiSpy },
				{ provide: Router, useValue: routerSpy },
			],
		});

		store = TestBed.inject(AuthStore);
		authApiService = TestBed.inject(AuthApiService) as jasmine.SpyObj<AuthApiService>;
		router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

		// Clear localStorage before each test
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	describe('initial state', () => {
		it('should have correct initial state', () => {
			expect(store.currentUser()).toBeNull();
			expect(store.isInitialized()).toBe(false);
			expect(store.isGuardValidated()).toBe(false);
			expect(store.isTokenRefreshing()).toBe(false);
			expect(store.isLoggingIn()).toBe(false);
			expect(store.isLoggingOut()).toBe(false);
			expect(store.loginError()).toBeNull();
			expect(store.minLoadingTimeElapsed()).toBe(false);
			expect(store.pendingRefreshToken()).toBeNull();
		});

		it('should have correct computed signals', () => {
			expect(store.isAuthenticated()).toBe(false);
			expect(store.isLoadingComplete()).toBe(false);
			expect(store.userPermissions()).toEqual([]);
			expect(store.userRoles()).toEqual([]);
		});
	});

	describe('login', () => {
		it('should set isLoggingIn to true when login starts', () => {
			authApiService.login.and.returnValue(of(mockLoginResponse));
			store.login({ email: 'test@example.com', password: 'password' });

			expect(store.isLoggingIn()).toBe(true);
		});

		it('should update state on successful login', (done) => {
			authApiService.login.and.returnValue(of(mockLoginResponse));

			store.login({ email: 'test@example.com', password: 'password' });

			setTimeout(() => {
				expect(store.currentUser()).toBeTruthy();
				expect(store.currentUser()?.email).toBe('test@example.com');
				expect(store.isLoggingIn()).toBe(false);
				expect(store.loginError()).toBeNull();
				done();
			}, 100);
		});

		it('should persist user to localStorage on successful login', (done) => {
			authApiService.login.and.returnValue(of(mockLoginResponse));

			store.login({ email: 'test@example.com', password: 'password' });

			setTimeout(() => {
				const stored = localStorage.getItem('auth_user');
				expect(stored).toBeTruthy();
				const parsed = JSON.parse(stored!);
				expect(parsed.email).toBe('test@example.com');
				done();
			}, 100);
		});

		it('should set loginError on failed login', (done) => {
			const errorResponse = { error: { code: 'INVALID_CREDENTIALS' } };
			authApiService.login.and.returnValue(throwError(() => errorResponse));

			store.login({ email: 'test@example.com', password: 'wrong' });

			setTimeout(() => {
				expect(store.isLoggingIn()).toBe(false);
				expect(store.loginError()).toEqual({ code: 'INVALID_CREDENTIALS' });
				expect(store.currentUser()).toBeNull();
				done();
			}, 100);
		});
	});

	describe('logout', () => {
		beforeEach(() => {
			// Set up authenticated state
			const mockUser: IUser = {
				id: 1,
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				fullName: 'Test User',
				roles: [],
				permissions: [],
				token: 'mock-token',
				hasPermission: () => false,
				hasPermissionByIdentifier: () => false,
				hasRole: () => false,
			};
			store.updateCurrentUser(mockUser);
		});

		it('should clear current user immediately', () => {
			authApiService.logout.and.returnValue(of(undefined));

			store.logout();

			expect(store.currentUser()).toBeNull();
		});

		it('should set isLoggingOut to true', () => {
			authApiService.logout.and.returnValue(of(undefined));

			store.logout();

			expect(store.isLoggingOut()).toBe(true);
		});

		it('should clear localStorage', () => {
			authApiService.logout.and.returnValue(of(undefined));
			localStorage.setItem('auth_user', '{"email":"test"}');

			store.logout();

			expect(localStorage.getItem('auth_user')).toBeNull();
		});

		it('should set isLoggingOut to false on success', (done) => {
			authApiService.logout.and.returnValue(of(undefined));

			store.logout();

			setTimeout(() => {
				expect(store.isLoggingOut()).toBe(false);
				done();
			}, 100);
		});

		it('should set isLoggingOut to false on error', (done) => {
			authApiService.logout.and.returnValue(throwError(() => new Error('Network error')));

			store.logout();

			setTimeout(() => {
				expect(store.isLoggingOut()).toBe(false);
				done();
			}, 100);
		});
	});

	describe('refreshToken', () => {
		beforeEach(() => {
			const mockUser: IUser = {
				id: 1,
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				fullName: 'Test User',
				roles: [],
				permissions: [],
				token: 'old-token',
				hasPermission: () => false,
				hasPermissionByIdentifier: () => false,
				hasRole: () => false,
			};
			store.updateCurrentUser(mockUser);
		});

		it('should update user token on successful refresh', (done) => {
			authApiService.refreshToken.and.returnValue(of(mockRefreshResponse));

			store.refreshToken().subscribe(() => {
				expect(store.currentUser()?.token).toBe('new-mock-token');
				done();
			});
		});

		it('should update pendingRefreshToken for interceptor coordination', (done) => {
			authApiService.refreshToken.and.returnValue(of(mockRefreshResponse));

			store.refreshToken().subscribe(() => {
				expect(store.pendingRefreshToken()).toBe('new-mock-token');
				done();
			});
		});

		it('should persist updated user to localStorage', (done) => {
			authApiService.refreshToken.and.returnValue(of(mockRefreshResponse));

			store.refreshToken().subscribe(() => {
				const stored = localStorage.getItem('auth_user');
				const parsed = JSON.parse(stored!);
				expect(parsed.token).toBe('new-mock-token');
				done();
			});
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

		it('should set minLoadingTimeElapsed after timeout', (done) => {
			store.restoreFromStorage();

			expect(store.minLoadingTimeElapsed()).toBe(false);

			setTimeout(() => {
				expect(store.minLoadingTimeElapsed()).toBe(true);
				done();
			}, 1100);
		});
	});

	describe('computed signals', () => {
		it('should compute isAuthenticated based on currentUser', () => {
			expect(store.isAuthenticated()).toBe(false);

			const mockUser: IUser = {
				id: 1,
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				fullName: 'Test User',
				roles: [],
				permissions: [],
				token: 'mock-token',
				hasPermission: () => false,
				hasPermissionByIdentifier: () => false,
				hasRole: () => false,
			};
			store.updateCurrentUser(mockUser);

			expect(store.isAuthenticated()).toBe(true);
		});

		it('should compute isLoadingComplete based on flags', () => {
			expect(store.isLoadingComplete()).toBe(false);

			store.restoreFromStorage();
			expect(store.isLoadingComplete()).toBe(false);

			store.setGuardValidated(true);
			expect(store.isLoadingComplete()).toBe(false);

			// Wait for minLoadingTimeElapsed
			setTimeout(() => {
				expect(store.isLoadingComplete()).toBe(true);
			}, 1100);
		});

		it('should compute userPermissions from currentUser', () => {
			const mockPermission = {
				id: 1,
				resource: 'users',
				action: 'read',
				identifier: 'users:read',
				matches: () => true,
			};

			const mockUser: IUser = {
				id: 1,
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				fullName: 'Test User',
				roles: [],
				permissions: [mockPermission],
				token: 'mock-token',
				hasPermission: () => false,
				hasPermissionByIdentifier: () => false,
				hasRole: () => false,
			};
			store.updateCurrentUser(mockUser);

			expect(store.userPermissions()).toEqual([mockPermission]);
		});
	});

	describe('state management methods', () => {
		it('should update guard validation status', () => {
			expect(store.isGuardValidated()).toBe(false);

			store.setGuardValidated(true);

			expect(store.isGuardValidated()).toBe(true);
		});

		it('should update token refreshing status', () => {
			expect(store.isTokenRefreshing()).toBe(false);

			store.setTokenRefreshing(true);

			expect(store.isTokenRefreshing()).toBe(true);
		});

		it('should clear pending refresh token', () => {
			authApiService.refreshToken.and.returnValue(of(mockRefreshResponse));

			store.refreshToken().subscribe(() => {
				expect(store.pendingRefreshToken()).toBe('new-mock-token');

				store.clearPendingRefreshToken();

				expect(store.pendingRefreshToken()).toBeNull();
			});
		});
	});

	describe('getPendingRefreshToken$', () => {
		it('should return observable of pendingRefreshToken signal', (done) => {
			const refreshToken$ = store.getPendingRefreshToken$();

			refreshToken$.subscribe((token) => {
				expect(token).toBeNull();
				done();
			});
		});
	});
});
