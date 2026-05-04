import { provideRouter } from '@angular/router'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { Navigation } from '@resetshop/angular-core/navigation/navigation'
import { AuthStore } from '@store/auth/auth.store'
import { render, screen } from '@testing-library/angular'
import DashboardHome from './dashboard-home'

describe('DashboardHome', () => {
	const navigationMock = {
		sections: () => [],
		breadcrumbs: () => [],
	}

	const baseProviders = () => [
		provideRouter([]),
		provideTranslationMock(),
		AuthStore,
		{ provide: AuthApi, useValue: new InMemoryAuthApi() },
		{ provide: Navigation, useValue: navigationMock },
	]

	it('renders the no-module-access alert when the current user has no permissions', async () => {
		const { fixture } = await render(DashboardHome, { providers: baseProviders() })
		const store = fixture.debugElement.injector.get(AuthStore)
		store.updateCurrentUser(createMockUser({ permissions: [] }))
		fixture.detectChanges()

		expect(screen.getByTestId('no-module-access')).toBeInTheDocument()
	})

	it('hides the no-module-access alert when the current user has at least one permission', async () => {
		const { fixture } = await render(DashboardHome, { providers: baseProviders() })
		const store = fixture.debugElement.injector.get(AuthStore)
		store.updateCurrentUser(
			createMockUser({
				permissions: [
					{
						id: 1,
						name: 'Read users',
						description: 'View users',
						module: 'admin',
						resource: 'users',
						action: 'read',
						identifier: 'admin:users:read',
					},
				],
			}),
		)
		fixture.detectChanges()

		expect(screen.queryByTestId('no-module-access')).not.toBeInTheDocument()
	})
})
