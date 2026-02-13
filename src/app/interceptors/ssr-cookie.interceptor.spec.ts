import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ssrCookieInterceptor } from './ssr-cookie.interceptor';

describe('ssrCookieInterceptor', () => {
	let http: HttpClient;
	let httpMock: HttpTestingController;

	function setup(request: { headers: { get: (name: string) => string | null } } | null) {
		TestBed.configureTestingModule({
			providers: [
				provideHttpClient(withInterceptors([ssrCookieInterceptor])),
				provideHttpClientTesting(),
				{ provide: REQUEST, useValue: request },
			],
		});

		http = TestBed.inject(HttpClient);
		httpMock = TestBed.inject(HttpTestingController);
	}

	afterEach(() => {
		httpMock.verify();
	});

	it('should forward cookies from REQUEST to API requests', () => {
		const mockRequest = {
			headers: { get: (name: string) => (name === 'cookie' ? 'access_token=abc; refresh_token=xyz' : null) },
		};
		setup(mockRequest);

		http.get('/api/auth/me').subscribe();

		const req = httpMock.expectOne('/api/auth/me');
		expect(req.request.headers.get('Cookie')).toBe('access_token=abc; refresh_token=xyz');
		req.flush({});
	});

	it('should not add Cookie header for non-API requests', () => {
		const mockRequest = {
			headers: { get: (name: string) => (name === 'cookie' ? 'access_token=abc' : null) },
		};
		setup(mockRequest);

		http.get('/assets/i18n/en.json').subscribe();

		const req = httpMock.expectOne('/assets/i18n/en.json');
		expect(req.request.headers.has('Cookie')).toBe(false);
		req.flush({});
	});

	it('should not add Cookie header when REQUEST has no cookies', () => {
		const mockRequest = {
			headers: { get: () => null },
		};
		setup(mockRequest);

		http.get('/api/users').subscribe();

		const req = httpMock.expectOne('/api/users');
		expect(req.request.headers.has('Cookie')).toBe(false);
		req.flush({});
	});

	it('should pass through when REQUEST is not available', () => {
		setup(null);

		http.get('/api/auth/me').subscribe();

		const req = httpMock.expectOne('/api/auth/me');
		expect(req.request.headers.has('Cookie')).toBe(false);
		req.flush({});
	});
});
