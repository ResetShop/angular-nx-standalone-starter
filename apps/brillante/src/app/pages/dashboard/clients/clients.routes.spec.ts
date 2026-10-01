import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import type { Route } from '@angular/router'
import { provideRouter } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { customerTranslation } from '@domain/customer/customer-translation.mock'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { environment } from '../../../environments/environment'
import ClientsList from './clients-list/clients-list'
import routes from './clients.routes'

describe('clients routes', () => {
	beforeEach(() => {
		useFakeTimers()
	})

	afterEach(() => {
		useRealTimers()
	})

	it('declares one parent route that owns the section providers', () => {
		expect(routes).toHaveLength(1)
		expect(routes[0].providers).toHaveLength(3)
		expect(routes[0].children).toHaveLength(1)
	})

	it('does not repeat providers on the child pages', () => {
		for (const child of (routes[0].children ?? []) as Route[]) {
			expect(child.providers).toBeUndefined()
		}
	})

	it('titles the list page with a translation key', () => {
		expect(routes[0].children?.[0].title).toBe('CLIENTS.PAGE.TITLE')
	})

	it('serves the list page wired to the HTTP customer API through the parent providers', async () => {
		TestBed.configureTestingModule({
			providers: [
				provideRouter(routes),
				provideHttpClient(),
				provideHttpClientTesting(),
				provideAuthMock(),
				provideIdentityMock(),
				{ provide: Translation, useValue: customerTranslation },
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(createMockUser())
		const http = TestBed.inject(HttpTestingController)

		const harness = await RouterTestingHarness.create()
		const page = await harness.navigateByUrl('/', ClientsList)
		TestBed.tick()

		expect(page).toBeInstanceOf(ClientsList)
		const request = http.expectOne(`${environment.apiUrl}/client/getAll/0/10`)
		request.flush({ count: 0, rows: [] })
		http.verify()
	})
})
