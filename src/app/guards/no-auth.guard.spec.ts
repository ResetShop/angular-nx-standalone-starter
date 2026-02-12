import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { createMockUser } from '@mocks/user.mock';
import { AuthApiService } from '@providers/auth/auth';
import { AuthStore } from '@store/auth/auth.store';
import { clearAllMocks, fn } from '@test-utils';
import { noAuthGuard } from './no-auth.guard';

describe('noAuthGuard', () => {
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

	it('should initialize auth state when not yet initialized', () => {
		expect(store.isInitialized()).toBe(false);

		TestBed.runInInjectionContext(() => noAuthGuard({} as never, {} as never));

		expect(store.isInitialized()).toBe(true);
	});

	it('should restore user from localStorage during initialization', () => {
		const validData = {
			id: 1,
			email: 'stored@example.com',
			firstName: 'Stored',
			lastName: 'User',
			roles: [],
			token: 'stored-token',
		};
		localStorage.setItem('auth_user', JSON.stringify(validData));

		const result = TestBed.runInInjectionContext(() => noAuthGuard({} as never, {} as never));

		expect(store.currentUser()?.email).toBe('stored@example.com');
		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe('/dashboard');
	});

	it('should not re-initialize when already initialized', () => {
		store.restoreFromStorage();

		localStorage.setItem(
			'auth_user',
			JSON.stringify({
				id: 2,
				email: 'different@example.com',
				firstName: 'Other',
				lastName: 'User',
				roles: [],
				token: 'other-token',
			}),
		);

		TestBed.runInInjectionContext(() => noAuthGuard({} as never, {} as never));

		expect(store.currentUser()).toBeNull();
	});

	it('should return true when user is not authenticated', () => {
		const result = TestBed.runInInjectionContext(() => noAuthGuard({} as never, {} as never));

		expect(result).toBe(true);
	});

	it('should redirect to /dashboard when user is authenticated', () => {
		store.updateCurrentUser(createMockUser());
		store.restoreFromStorage();

		const result = TestBed.runInInjectionContext(() => noAuthGuard({} as never, {} as never));

		expect(result).toBeInstanceOf(UrlTree);
		expect((result as UrlTree).toString()).toBe('/dashboard');
	});
});
