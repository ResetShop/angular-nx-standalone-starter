import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
	let http: HttpClient;
	let httpMock: HttpTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
		});

		http = TestBed.inject(HttpClient);
		httpMock = TestBed.inject(HttpTestingController);
	});

	afterEach(() => {
		httpMock.verify();
	});

	it('should set withCredentials for API requests', () => {
		http.get('/api/users').subscribe();

		const req = httpMock.expectOne('/api/users');
		expect(req.request.withCredentials).toBe(true);
		req.flush({});
	});

	it('should set withCredentials for nested API paths', () => {
		http.get('/api/auth/me').subscribe();

		const req = httpMock.expectOne('/api/auth/me');
		expect(req.request.withCredentials).toBe(true);
		req.flush({});
	});

	it('should not set withCredentials for non-API requests', () => {
		http.get('/assets/i18n/en.json').subscribe();

		const req = httpMock.expectOne('/assets/i18n/en.json');
		expect(req.request.withCredentials).toBe(false);
		req.flush({});
	});

	it('should not set withCredentials for external URLs', () => {
		http.get('https://cdn.example.com/api/data').subscribe();

		const req = httpMock.expectOne('https://cdn.example.com/api/data');
		expect(req.request.withCredentials).toBe(false);
		req.flush({});
	});
});
