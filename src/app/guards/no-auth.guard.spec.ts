import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter, UrlTree } from '@angular/router';
import { createMockUser } from '@mocks/user.mock';
import { AuthApiService } from '@providers/auth/auth';
import { AuthStore } from '@store/auth/auth.store';
import { clearAllMocks, fn } from '@test-utils';
import { throwError } from 'rxjs';
import { noAuthGuard } from './no-auth.guard';

describe('noAuthGuard', () => {
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

	it('should return true when user is not authenticated', () => {
		const result = TestBed.runInInjectionContext(() =>
			noAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
		);

		expect(result).toBe(true);
	});

	it('should redirect to /dashboard when user is authenticated', () => {
		store.updateCurrentUser(createMockUser());

		const result = TestBed.runInInjectionContext(() =>
			noAuthGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
		);

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe('/dashboard');
	});
});
