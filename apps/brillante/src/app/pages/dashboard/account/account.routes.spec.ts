import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import type { Route } from '@angular/router'
import { provideRouter } from '@angular/router'
import { RouterTestingHarness } from '@angular/router/testing'
import { UserRole } from '@contracts/permission/permission.constants'
import { customerTranslation } from '@domain/customer/customer-translation.mock'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { environment } from '../../../environments/environment'
import routes from './account.routes'
import ProfilePage from './profile-page/profile-page'

describe('account routes', () => {
	beforeEach(() => {
		useFakeTimers()
	})

	afterEach(() => {
		useRealTimers()
	})

	it('declares one parent route that owns the section providers', () => {
		expect(routes).toHaveLength(1)
		expect(routes[0].providers).toHaveLength(4)
		expect(routes[0].children).toHaveLength(1)
	})

	it('does not repeat providers on the child pages', () => {
		for (const child of (routes[0].children ?? []) as Route[]) {
			expect(child.providers).toBeUndefined()
		}
	})

	it('titles the profile page with a translation key', () => {
		expect(routes[0].children?.[0].title).toBe('PROFILE.TITLE')
	})

	it('serves the profile page wired to the HTTP customer API through the parent providers', async () => {
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
		TestBed.inject(AuthStore).updateCurrentUser(
			createMockUser({
				email: 'ana@brillante.test',
				roles: [{ id: UserRole.CUSTOMER, description: 'customer' }],
				hasRole: (roleId) => roleId === UserRole.CUSTOMER,
			}),
		)
		const http = TestBed.inject(HttpTestingController)

		const harness = await RouterTestingHarness.create()
		const page = await harness.navigateByUrl('/', ProfilePage)
		TestBed.tick()

		expect(page).toBeInstanceOf(ProfilePage)
		http.expectOne(`${environment.apiUrl}/client/getByEmail/ana%40brillante.test`).flush(null)
		http.verify()
	})
})
