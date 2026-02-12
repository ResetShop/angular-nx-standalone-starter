import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter, UrlTree } from '@angular/router';
import { createMockUser } from '@mocks/user.mock';
import { AuthApiService } from '@providers/auth/auth';
import { AuthStore } from '@store/auth/auth.store';
import { clearAllMocks, fn } from '@test-utils';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
	let store: InstanceType<typeof AuthStore>;

	beforeEach(() => {
		clearAllMocks();

		TestBed.configureTestingModule({
			providers: [
				AuthStore,
				provideRouter([]),
				{
					provide: AuthApiService,
					useValue: { login: fn(), logout: fn(), refreshToken: fn(), getMe: fn() },
				},
			],
		});

		store = TestBed.inject(AuthStore);

		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
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
});
