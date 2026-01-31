import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { LoginRequest, LoginResponse, MeResponse, RefreshResponse } from '@contracts/auth/auth.types';
import { AuthApiService } from './auth';

describe('AuthApiService', () => {
	let service: AuthApiService;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [AuthApiService, provideHttpClient(), provideHttpClientTesting()],
		});

		service = TestBed.inject(AuthApiService);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	describe('login', () => {
		it('should make POST request to /api/auth/login', () => {
			const loginRequest: LoginRequest = {
				email: 'test@example.com',
				password: 'password123',
			};

			const mockResponse: LoginResponse = {
				user: {
					id: 1,
					email: 'test@example.com',
					firstName: 'Test',
					lastName: 'User',
					roles: [],
				},
				token: 'mock-token',
			};

			service.login(loginRequest).subscribe((response) => {
				expect(response).toEqual(mockResponse);
			});

			const req = httpMock.expectOne('/api/auth/login');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual(loginRequest);
			expect(req.request.withCredentials).toBe(true);

			req.flush(mockResponse);
		});

		it('should include credentials in request', () => {
			const loginRequest: LoginRequest = {
				email: 'test@example.com',
				password: 'password123',
			};

			service.login(loginRequest).subscribe();

			const req = httpMock.expectOne('/api/auth/login');
			expect(req.request.withCredentials).toBe(true);
			req.flush({});
		});
	});

	describe('logout', () => {
		it('should make POST request to /api/auth/logout', () => {
			service.logout().subscribe();

			const req = httpMock.expectOne('/api/auth/logout');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({});
			expect(req.request.withCredentials).toBe(true);

			req.flush(null);
		});

		it('should include credentials in request', () => {
			service.logout().subscribe();

			const req = httpMock.expectOne('/api/auth/logout');
			expect(req.request.withCredentials).toBe(true);
			req.flush(null);
		});
	});

	describe('refreshToken', () => {
		it('should make POST request to /api/auth/refresh', () => {
			const mockResponse: RefreshResponse = {
				token: 'new-token',
			};

			service.refreshToken().subscribe((response) => {
				expect(response).toEqual(mockResponse);
			});

			const req = httpMock.expectOne('/api/auth/refresh');
			expect(req.request.method).toBe('POST');
			expect(req.request.body).toEqual({});
			expect(req.request.withCredentials).toBe(true);

			req.flush(mockResponse);
		});

		it('should include credentials in request', () => {
			service.refreshToken().subscribe();

			const req = httpMock.expectOne('/api/auth/refresh');
			expect(req.request.withCredentials).toBe(true);
			req.flush({});
		});
	});

	describe('getMe', () => {
		it('should make GET request to /api/auth/me', () => {
			const mockResponse: MeResponse = {
				user: {
					id: 1,
					email: 'test@example.com',
					firstName: 'Test',
					lastName: 'User',
					roles: [],
				},
			};

			service.getMe().subscribe((response) => {
				expect(response).toEqual(mockResponse);
			});

			const req = httpMock.expectOne('/api/auth/me');
			expect(req.request.method).toBe('GET');
			expect(req.request.withCredentials).toBe(true);

			req.flush(mockResponse);
		});

		it('should include credentials in request', () => {
			service.getMe().subscribe();

			const req = httpMock.expectOne('/api/auth/me');
			expect(req.request.withCredentials).toBe(true);
			req.flush({});
		});
	});

	describe('error handling', () => {
		it('should propagate HTTP errors', () => {
			const loginRequest: LoginRequest = {
				email: 'test@example.com',
				password: 'wrong-password',
			};

			service.login(loginRequest).subscribe({
				next: () => fail('should have failed'),
				error: (error) => {
					expect(error.status).toBe(401);
					expect(error.error.code).toBe('INVALID_CREDENTIALS');
				},
			});

			const req = httpMock.expectOne('/api/auth/login');
			req.flush({ code: 'INVALID_CREDENTIALS' }, { status: 401, statusText: 'Unauthorized' });
		});
	});
});
