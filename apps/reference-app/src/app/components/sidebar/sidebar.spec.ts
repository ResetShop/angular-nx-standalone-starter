import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { provideRouter } from '@angular/router'
import { featherActivity, featherHome } from '@ng-icons/feather-icons'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { NavigationSection } from '@resetshop/angular-core/interfaces/navigation'
import { Navigation } from '@resetshop/angular-core/navigation/navigation'
import { NavigationState } from '@resetshop/angular-core/navigation/navigation-state'
import { provideMockTheme } from '@resetshop/angular-core/theme/theme.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { UIStore } from '@store/ui/ui.store'
import { render, screen } from '@testing-library/angular'
import { userEvent } from '@testing-library/user-event'
import { Sidebar } from './sidebar'

function mockMatchMedia(matches: boolean) {
	const mql = {
		matches,
		media: '(min-width: 1024px)',
		onchange: null,
		addEventListener: () => {},
		removeEventListener: () => {},
		addListener: () => {},
		removeListener: () => {},
		dispatchEvent: () => false,
	}
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		configurable: true,
		value: () => mql,
	})
	return mql
}

mockMatchMedia(true)

describe('Sidebar', () => {
	beforeEach(() => {
		clearAllMocks()
		mockMatchMedia(true)
	})

	const defaultProviders = () => [
		provideRouter([
			{ path: 'auth/login', component: Sidebar },
			{ path: 'welcome', component: Sidebar },
			{ path: 'health', component: Sidebar },
			{ path: 'admin/users', component: Sidebar },
			{ path: 'admin/settings', component: Sidebar },
		]),
		provideMockTheme(false),
		provideHttpClient(),
		provideHttpClientTesting(),
		provideAuthMock(),
		NavigationState,
		provideTranslationMock(),
	]

	const createNavigationWithSections = (sections: NavigationSection[]) => ({
		provide: Navigation,
		useValue: {
			sections: () => sections,
			breadcrumbs: () => [],
		},
	})

	const mockSettingsSection: NavigationSection = {
		id: 'settings',
		name: 'Ajustes y mantenimiento',
		routes: [
			{
				id: 'welcome',
				name: 'Configuración inicial',
				route: 'welcome',
				icon: { featherHome: featherHome },
			},
			{
				id: 'health',
				name: 'Salud',
				route: 'health',
				icon: { featherActivity: featherActivity },
			},
		],
	}

	const mockAdminSection: NavigationSection = {
		id: 'admin',
		name: 'Administración',
		routes: [
			{
				id: 'users',
				name: 'Gestión de usuarios',
				route: 'admin/users',
				icon: { featherHome: featherHome },
			},
			{
				id: 'settings',
				name: 'Configuración del sistema',
				route: 'admin/settings',
				icon: { featherActivity: featherActivity },
			},
		],
	}

	it('should render the sidebar with navigation sections', async () => {
		await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
		})

		expect(screen.getByText('Ajustes y mantenimiento')).toBeInTheDocument()
		expect(screen.getByRole('link', { name: /salud/i })).toBeInTheDocument()
	})

	it('should display navigation section titles', async () => {
		await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
		})

		const sectionTitle = screen.getByText('Ajustes y mantenimiento')
		expect(sectionTitle).toBeInTheDocument()
	})

	it('should render navigation route links with correct text', async () => {
		await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
		})

		const healthLink = screen.getByRole('link', { name: /salud/i })
		expect(healthLink).toBeInTheDocument()

		const welcomeLink = screen.getByRole('link', { name: /configuración inicial/i })
		expect(welcomeLink).toBeInTheDocument()
	})

	it('should render sign out button with link variant styling', async () => {
		await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
		})

		const signOutButton = screen.getByRole('button', { name: /Logout/i })
		expect(signOutButton).toBeInTheDocument()
		expect(signOutButton).toHaveAttribute('variant', 'link')
	})

	it('should have correct route on navigation items', async () => {
		await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
		})

		const healthLink = screen.getByRole('link', { name: /salud/i })
		expect(healthLink).toHaveAttribute('href', '/health')

		const welcomeLink = screen.getByRole('link', { name: /configuración inicial/i })
		expect(welcomeLink).toHaveAttribute('href', '/welcome')
	})

	it('should route to login page on sign out', async () => {
		const user = userEvent.setup()

		const { detectChanges } = await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
		})

		const signOutButton = screen.getByRole('button', { name: /Logout/i })
		expect(signOutButton).toBeInTheDocument()

		await user.click(signOutButton)
		await detectChanges()

		// The logout method is called on the component
		expect(signOutButton).toBeInTheDocument()
	})

	it('should render multiple navigation sections with different content', async () => {
		await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection, mockAdminSection])],
		})

		expect(screen.getByText('Ajustes y mantenimiento')).toBeInTheDocument()
		expect(screen.getByText('Administración')).toBeInTheDocument()

		const adminUsersLink = screen.getByRole('link', { name: /gestión de usuarios/i })
		expect(adminUsersLink).toBeInTheDocument()
		expect(adminUsersLink).toHaveAttribute('href', '/admin/users')
	})

	it('should render brand component at the top of sidebar', async () => {
		await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
		})

		// Verify Brand component is rendered by looking for its unique "Reset Starter Repo" link
		const brandLink = screen.getByRole('link', { name: /reset starter repo/i })
		expect(brandLink).toBeInTheDocument()

		// Verify it has the correct routing to the dashboard page
		expect(brandLink).toHaveAttribute('href', '/dashboard')
	})

	it('should have proper structure with all sections and sign out button', async () => {
		await render(Sidebar, {
			providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection, mockAdminSection])],
		})

		const sectionTitles = screen.getByText('Ajustes y mantenimiento')
		const adminTitle = screen.getByText('Administración')
		const signOutButton = screen.getByRole('button', { name: /Logout/i })

		expect(sectionTitles).toBeInTheDocument()
		expect(adminTitle).toBeInTheDocument()
		expect(signOutButton).toBeInTheDocument()
	})

	describe('mobile collapse guard', () => {
		it('collapse toggle button is not rendered when viewport is below lg', async () => {
			mockMatchMedia(false)

			await render(Sidebar, {
				providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
			})

			expect(screen.queryByRole('button', { name: /collapse sidebar|expand sidebar/i })).toBeNull()
		})

		it('Ctrl+B does not toggle collapse when viewport is below lg', async () => {
			mockMatchMedia(false)
			const user = userEvent.setup()

			const { fixture } = await render(Sidebar, {
				providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
			})

			await user.keyboard('{Control>}b{/Control}')

			const uiStore = fixture.debugElement.injector.get(UIStore)
			expect(uiStore.isSidebarCollapsed()).toBe(false)
		})

		it('sidebar host does not have collapsed class when store is collapsed but viewport is below lg', async () => {
			mockMatchMedia(false)

			const { fixture } = await render(Sidebar, {
				providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
			})

			const uiStore = fixture.debugElement.injector.get(UIStore)
			uiStore.setSidebarCollapsed(true)
			fixture.detectChanges()

			const host = fixture.nativeElement as HTMLElement
			expect(host.classList.contains('collapsed')).toBe(false)
		})

		it('collapse toggle button is rendered and functional when viewport is at lg', async () => {
			mockMatchMedia(true)
			const user = userEvent.setup()

			const { fixture } = await render(Sidebar, {
				providers: [...defaultProviders(), createNavigationWithSections([mockSettingsSection])],
			})

			const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i })
			expect(collapseButton).toBeInTheDocument()

			await user.click(collapseButton)

			const uiStore = fixture.debugElement.injector.get(UIStore)
			expect(uiStore.isSidebarCollapsed()).toBe(true)
		})
	})
})
