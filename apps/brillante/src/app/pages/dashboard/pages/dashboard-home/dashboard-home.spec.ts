import { provideRouter } from '@angular/router'
import { Permission } from '@contracts/permission/legacy-permission.constants'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { IdentityApi } from '@providers/identity/identity.interface'
import { InMemoryIdentityApi } from '@providers/identity/identity.mock'
import type { NavigationSection } from '@resetshop/angular-core/interfaces/navigation'
import { Navigation } from '@resetshop/angular-core/navigation/navigation'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { render, screen } from '@testing-library/angular'
import { dashboardNavigationConfig } from '../../dashboard.navigation'
import DashboardHome from './dashboard-home'

describe('DashboardHome', () => {
	const sections: NavigationSection[] = dashboardNavigationConfig.sections

	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()
	})

	async function renderHome(permissions: string[]) {
		const view = await render(DashboardHome, {
			providers: [
				provideRouter([]),
				provideTranslationMock(),
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
				{ provide: IdentityApi, useValue: new InMemoryIdentityApi() },
				{ provide: Navigation, useValue: { sections: () => sections, breadcrumbs: () => [] } },
			],
		})
		view.fixture.debugElement.injector
			.get(AuthStore)
			.updateCurrentUser(createMockUser({ firstName: 'Clara', permissions }))
		view.fixture.detectChanges()
		return view
	}

	it('greets the signed-in user by first name', async () => {
		await renderHome([Permission.CASH_READ])

		expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('SHELL.HOME.WELCOME')
	})

	it('warns users who hold no permission that no module is available', async () => {
		await renderHome([])

		expect(screen.getByRole('status')).toHaveTextContent('SHELL.HOME.NO_ACCESS_MESSAGE')
	})

	it('does not show the no-access warning to users with permissions', async () => {
		await renderHome([Permission.CASH_READ])

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
	})

	it('offers a card for every module but the dashboard itself', async () => {
		await renderHome([Permission.CASH_READ])

		expect(screen.getByRole('link', { name: /SHELL\.NAV\.CASH/ })).toHaveAttribute('href', '/dashboard/cash')
		expect(screen.queryByRole('link', { name: /SHELL\.NAV\.HOME/ })).not.toBeInTheDocument()
	})
})
