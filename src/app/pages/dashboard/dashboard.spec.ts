import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { signal } from '@angular/core'
import { provideRouter } from '@angular/router'
import type { BreadcrumbItem, NavigationSection } from '@interfaces/navigation'
import { featherActivity, featherHome } from '@ng-icons/feather-icons'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { Navigation } from '@providers/navigation/navigation'
import { NavigationState } from '@providers/navigation/navigation-state'
import { provideMockTheme } from '@providers/theme/theme.mock'
import { UIStore } from '@store/ui/ui.store'
import { render, screen } from '@testing-library/angular'
import Dashboard from './dashboard'

describe('Dashboard', () => {
	const mockGlobalLoading = signal(false)

	const mockUIStore = {
		isGlobalLoading: mockGlobalLoading,
		setGlobalLoading: (value: boolean) => mockGlobalLoading.set(value),
	}

	const defaultProviders = () => [
		provideRouter([
			{ path: 'auth/login', component: Dashboard },
			{ path: 'welcome', component: Dashboard },
			{ path: 'health', component: Dashboard },
		]),
		provideMockTheme(false),
		provideHttpClient(),
		provideHttpClientTesting(),
		provideAuthMock(),
		NavigationState,
		{ provide: UIStore, useValue: mockUIStore },
	]

	const createNavigationWithSectionsAndBreadcrumbs = (
		sections: NavigationSection[],
		breadcrumbs: BreadcrumbItem[],
	) => ({
		provide: Navigation,
		useValue: {
			sections: () => sections,
			breadcrumbs: () => breadcrumbs,
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

	const mockBreadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', path: '/dashboard', isActive: true }]

	beforeEach(() => {
		mockGlobalLoading.set(false)
	})

	it('should render the dashboard component with sidebar and header', async () => {
		const { fixture } = await render(Dashboard, {
			providers: [
				...defaultProviders(),
				createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
			],
		})

		expect(fixture.componentInstance).toBeTruthy()
	})

	it('should render the sidebar with navigation sections', async () => {
		await render(Dashboard, {
			providers: [
				...defaultProviders(),
				createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
			],
		})

		const sidebar = screen.getByRole('complementary')
		expect(sidebar).toBeInTheDocument()

		expect(screen.getByText('Ajustes y mantenimiento')).toBeInTheDocument()
	})

	it('should render main content area', async () => {
		await render(Dashboard, {
			providers: [
				...defaultProviders(),
				createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
			],
		})

		const main = screen.getByRole('main')
		expect(main).toBeInTheDocument()
	})

	it('should render header with breadcrumb navigation', async () => {
		await render(Dashboard, {
			providers: [
				...defaultProviders(),
				createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
			],
		})

		const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i })
		expect(breadcrumb).toBeInTheDocument()
	})

	it('should have proper layout structure with grid areas', async () => {
		await render(Dashboard, {
			providers: [
				...defaultProviders(),
				createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
			],
		})

		const sidebar = screen.getByRole('complementary')
		const header = screen.getByRole('navigation', { name: /breadcrumb/i })
		const main = screen.getByRole('main')

		expect(sidebar).toBeInTheDocument()
		expect(header).toBeInTheDocument()
		expect(main).toBeInTheDocument()
	})

	it('should render router outlet for nested routes', async () => {
		await render(Dashboard, {
			providers: [
				...defaultProviders(),
				createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
			],
		})

		const main = screen.getByRole('main')
		expect(main).toBeInTheDocument()
	})

	it('should render sign out button in sidebar', async () => {
		await render(Dashboard, {
			providers: [
				...defaultProviders(),
				createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
			],
		})

		const signOutButton = screen.getByRole('button', { name: /cerrar sesión/i })
		expect(signOutButton).toBeInTheDocument()
	})

	describe('global loading overlay', () => {
		it('should not render loading spinner when isGlobalLoading is false', async () => {
			await render(Dashboard, {
				providers: [
					...defaultProviders(),
					createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
				],
			})

			expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
		})

		it('should render loading spinner when isGlobalLoading is true', async () => {
			mockGlobalLoading.set(true)

			const { fixture } = await render(Dashboard, {
				providers: [
					...defaultProviders(),
					createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
				],
			})
			fixture.detectChanges()

			expect(screen.getByText('Cargando...')).toBeInTheDocument()
		})

		it('should hide loading spinner when isGlobalLoading is set back to false', async () => {
			mockGlobalLoading.set(true)

			const { fixture } = await render(Dashboard, {
				providers: [
					...defaultProviders(),
					createNavigationWithSectionsAndBreadcrumbs([mockSettingsSection], mockBreadcrumbs),
				],
			})
			fixture.detectChanges()
			expect(screen.getByText('Cargando...')).toBeInTheDocument()

			mockGlobalLoading.set(false)
			fixture.detectChanges()
			expect(screen.queryByText('Cargando...')).not.toBeInTheDocument()
		})
	})
})
