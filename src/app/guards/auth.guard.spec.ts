import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter, UrlTree } from '@angular/router';
import { createMockUser } from '@mocks/user.mock';
import { AuthApiService } from '@providers/auth/auth';
import { AuthStore } from '@store/auth/auth.store';
import { clearAllMocks, fn } from '@test-utils';
import { of, throwError } from 'rxjs';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
	let store: InstanceType<typeof AuthStore>;
	let authApiMock: ReturnType<typeof createAuthApiMock>;

	function createAuthApiMock() {
		return {
			login: fn(),
			logout: fn(),
			refreshToken: fn(),
			getMe: fn(),
		};
	}

	beforeEach(() => {
		clearAllMocks();

		authApiMock = createAuthApiMock();
		// Default: no session — store initializes with null user
		authApiMock.getMe.mockReturnValue(throwError(() => new Error('No session')));

		TestBed.configureTestingModule({
			providers: [AuthStore, provideRouter([]), { provide: AuthApiService, useValue: authApiMock }],
		});

		store = TestBed.inject(AuthStore);
		// APP_INITIALIZER calls initialize() before routing — replicate in tests
		store.initialize().subscribe();
	});

	it('should return true when user is authenticated', () => {
		store.updateCurrentUser(createMockUser());

		const result = TestBed.runInInjectionContext(() =>
			authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
		);

		expect(result).toBe(true);
	});

	it('should redirect to /auth/login when user is not authenticated', () => {
		const result = TestBed.runInInjectionContext(() =>
			authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
		);

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe('/auth/login');
	});

	it('should wait for initialization and allow authenticated user', () => {
		// getMe succeeds — user is authenticated after init
		authApiMock.getMe.mockReturnValue(
			of({
				id: 1,
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				roles: [],
			}),
		);

		TestBed.resetTestingModule();
		TestBed.configureTestingModule({
			providers: [AuthStore, provideRouter([]), { provide: AuthApiService, useValue: authApiMock }],
		});

		// APP_INITIALIZER calls initialize() before routing
		TestBed.inject(AuthStore).initialize().subscribe();

		const result = TestBed.runInInjectionContext(() =>
			authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
		);

		expect(result).toBe(true);
	});
});
