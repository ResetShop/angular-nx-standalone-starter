import { TestBed } from '@angular/core/testing';
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { provideRouter, UrlTree } from '@angular/router';
import { AuthApiService } from '@providers/auth/auth';
import { AuthStore } from '@store/auth/auth.store';
import { clearAllMocks, fn } from '@test-utils';
import type { Observable } from 'rxjs';
import { firstValueFrom, of, throwError } from 'rxjs';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
	let authApiMock: ReturnType<typeof createAuthApiMock>;

	function createAuthApiMock() {
		return {
			login: fn(),
			logout: fn(),
			refreshToken: fn(),
			getMe: fn(),
		};
	}

	function runGuard() {
		return TestBed.runInInjectionContext(() => authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
	}

	beforeEach(() => {
		clearAllMocks();

		authApiMock = createAuthApiMock();
		authApiMock.getMe.mockReturnValue(throwError(() => new Error('No session')));

		TestBed.configureTestingModule({
			providers: [AuthStore, provideRouter([]), { provide: AuthApiService, useValue: authApiMock }],
		});
	});

	it('should allow navigation when session is valid', async () => {
		authApiMock.getMe.mockReturnValue(
			of({
				id: 1,
				email: 'test@example.com',
				firstName: 'Test',
				lastName: 'User',
				roles: [],
			}),
		);

		const result = await firstValueFrom(runGuard() as Observable<boolean | UrlTree>);

		expect(result).toBe(true);
	});

	it('should redirect to /auth/login when session validation fails', async () => {
		const result = await firstValueFrom(runGuard() as Observable<boolean | UrlTree>);

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe('/auth/login');
	});

	it('should update currentUser with fresh data from /me response', async () => {
		authApiMock.getMe.mockReturnValue(
			of({
				id: 1,
				email: 'updated@example.com',
				firstName: 'Updated',
				lastName: 'User',
				roles: [],
			}),
		);

		const store = TestBed.inject(AuthStore);
		await firstValueFrom(runGuard() as Observable<boolean | UrlTree>);

		expect(store.currentUser()?.email).toBe('updated@example.com');
		expect(store.currentUser()?.firstName).toBe('Updated');
	});
});
