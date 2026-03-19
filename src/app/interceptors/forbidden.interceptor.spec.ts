import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { PLATFORM_ID } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { Translation } from '@providers/i18n/translation'
import { UIStore } from '@store/ui/ui.store'
import { NotificationType } from '@store/ui/ui.types'
import { clearAllMocks, fn, spyOn, type MockFn } from '@test-utils'
import { forbiddenInterceptor } from './forbidden.interceptor'

type UIStoreMock = {
	showNotification: MockFn<[{ type: string; message: string }], void>
}

function createUIStoreMock(): UIStoreMock {
	return {
		showNotification: fn<[{ type: string; message: string }], void>(),
	}
}

type TranslationMock = {
	instant: MockFn<[string], string>
}

function createTranslationMock(): TranslationMock {
	const mock: TranslationMock = {
		instant: fn<[string], string>(),
	}
	mock.instant.mockReturnValue("You don't have permission to perform this action")
	return mock
}

describe('forbiddenInterceptor', () => {
	describe('browser platform', () => {
		let http: HttpClient
		let httpMock: HttpTestingController
		let uiStoreMock: UIStoreMock
		let translationMock: TranslationMock
		let consoleErrorSpy: MockFn

		beforeEach(() => {
			clearAllMocks()

			uiStoreMock = createUIStoreMock()
			translationMock = createTranslationMock()

			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(withInterceptors([forbiddenInterceptor])),
					provideHttpClientTesting(),
					{ provide: PLATFORM_ID, useValue: 'browser' },
					{ provide: UIStore, useValue: uiStoreMock },
					{ provide: Translation, useValue: translationMock },
				],
			})

			http = TestBed.inject(HttpClient)
			httpMock = TestBed.inject(HttpTestingController)
			consoleErrorSpy = spyOn(console, 'error')
		})

		afterEach(() => {
			httpMock.verify()
		})

		it('should pass through successful requests', () => {
			let result: unknown
			http.get('/api/users').subscribe((r) => (result = r))

			httpMock.expectOne('/api/users').flush({ data: 'ok' })

			expect(result).toEqual({ data: 'ok' })
			expect(uiStoreMock.showNotification.calls).toHaveLength(0)
		})

		it('should pass through non-403 errors without showing notification', () => {
			let error: HttpErrorResponse | undefined
			http.get('/api/users').subscribe({ error: (e) => (error = e) })

			httpMock.expectOne('/api/users').flush(null, { status: 500, statusText: 'Server Error' })

			expect(error?.status).toBe(500)
			expect(uiStoreMock.showNotification.calls).toHaveLength(0)
		})

		it('should show toast notification on 403 response', () => {
			let error: HttpErrorResponse | undefined
			http.get('/api/users').subscribe({ error: (e) => (error = e) })

			httpMock.expectOne('/api/users').flush(null, { status: 403, statusText: 'Forbidden' })

			expect(error?.status).toBe(403)
			expect(uiStoreMock.showNotification.calls).toHaveLength(1)
			expect(uiStoreMock.showNotification.calls[0][0]).toEqual({
				type: NotificationType.ERROR,
				message: "You don't have permission to perform this action",
			})
		})

		it('should use translated message for the notification', () => {
			http.get('/api/roles').subscribe({ error: () => {} })

			httpMock.expectOne('/api/roles').flush(null, { status: 403, statusText: 'Forbidden' })

			expect(translationMock.instant.calls).toHaveLength(1)
			expect(translationMock.instant.calls[0][0]).toBe('HTTP.ERRORS.FORBIDDEN')
		})

		it('should not suppress the error — let it propagate to subscribers', () => {
			let error: HttpErrorResponse | undefined
			http.get('/api/users').subscribe({ error: (e) => (error = e) })

			httpMock.expectOne('/api/users').flush(null, { status: 403, statusText: 'Forbidden' })

			expect(error).toBeInstanceOf(HttpErrorResponse)
			expect(error?.status).toBe(403)
		})

		it('should log the 403 event for debugging', () => {
			http.get('/api/users').subscribe({ error: () => {} })

			httpMock.expectOne('/api/users').flush(null, { status: 403, statusText: 'Forbidden' })

			expect(consoleErrorSpy.calls).toHaveLength(1)
			expect(consoleErrorSpy.calls[0][0]).toBe('[ForbiddenInterceptor] 403 Forbidden:')
			expect(consoleErrorSpy.calls[0][1]).toBe('GET')
			expect(consoleErrorSpy.calls[0][2]).toContain('/api/users')
		})

		it('should show notification for each 403 response independently', () => {
			http.get('/api/users').subscribe({ error: () => {} })
			http.get('/api/roles').subscribe({ error: () => {} })

			httpMock.expectOne('/api/users').flush(null, { status: 403, statusText: 'Forbidden' })
			httpMock.expectOne('/api/roles').flush(null, { status: 403, statusText: 'Forbidden' })

			expect(uiStoreMock.showNotification.calls).toHaveLength(2)
		})
	})

	describe('server platform', () => {
		let http: HttpClient
		let httpMock: HttpTestingController
		let uiStoreMock: UIStoreMock

		beforeEach(() => {
			clearAllMocks()

			uiStoreMock = createUIStoreMock()

			TestBed.configureTestingModule({
				providers: [
					provideHttpClient(withInterceptors([forbiddenInterceptor])),
					provideHttpClientTesting(),
					{ provide: PLATFORM_ID, useValue: 'server' },
					{ provide: UIStore, useValue: uiStoreMock },
				],
			})

			http = TestBed.inject(HttpClient)
			httpMock = TestBed.inject(HttpTestingController)
		})

		afterEach(() => {
			httpMock.verify()
		})

		it('should pass through requests without intercepting on server', () => {
			let result: unknown
			http.get('/api/users').subscribe((r) => (result = r))

			httpMock.expectOne('/api/users').flush({ data: 'ssr' })

			expect(result).toEqual({ data: 'ssr' })
		})

		it('should not show notification on 403 during SSR', () => {
			let error: HttpErrorResponse | undefined
			http.get('/api/users').subscribe({ error: (e) => (error = e) })

			httpMock.expectOne('/api/users').flush(null, { status: 403, statusText: 'Forbidden' })

			expect(error?.status).toBe(403)
			expect(uiStoreMock.showNotification.calls).toHaveLength(0)
		})
	})
})
