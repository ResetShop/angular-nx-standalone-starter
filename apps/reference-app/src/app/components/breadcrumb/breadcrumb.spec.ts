import { provideRouter } from '@angular/router'
import { Breadcrumb } from '@components/breadcrumb/breadcrumb'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { BreadcrumbItem } from '@resetshop/angular-core/interfaces/navigation'
import { Navigation } from '@resetshop/angular-core/navigation/navigation'
import { render, screen } from '@testing-library/angular'

describe('Breadcrumb', () => {
	const defaultProviders = () => [provideTranslationMock(), provideRouter([])]

	const createNavigationWithBreadcrumbs = (breadcrumbs: BreadcrumbItem[]) => ({
		provide: Navigation,
		useValue: {
			breadcrumbs: () => breadcrumbs,
			sections: () => [],
		},
	})

	it('should render breadcrumb navigation element with semantic structure', async () => {
		const breadcrumbs: BreadcrumbItem[] = [
			{ title: 'Home', path: '/', isActive: false },
			{ title: 'Settings', path: '/settings', isActive: true },
		]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
		expect(nav).toBeInTheDocument()

		const list = screen.getByRole('list')
		expect(list).toBeInTheDocument()
	})

	it('should display single breadcrumb item as active when only one exists', async () => {
		const breadcrumbs: BreadcrumbItem[] = [{ title: 'Home', path: '/', isActive: true }]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		const currentPage = screen.getByText('Home')
		expect(currentPage).toHaveAttribute('aria-current', 'page')
	})

	it('should mark last breadcrumb as active and others as inactive links', async () => {
		const breadcrumbs: BreadcrumbItem[] = [
			{ title: 'Home', path: '/', isActive: false },
			{ title: 'Dashboard', path: '/dashboard', isActive: false },
			{ title: 'Settings', path: '/settings', isActive: true },
		]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		const homeLink = screen.getByRole('link', { name: /home/i })
		expect(homeLink).toHaveAttribute('href', '/')

		const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
		expect(dashboardLink).toHaveAttribute('href', '/dashboard')

		const settingsSpan = screen.getByText('Settings')
		expect(settingsSpan).toHaveAttribute('aria-current', 'page')
	})

	it('should render navigation items with multiple breadcrumb levels', async () => {
		const breadcrumbs: BreadcrumbItem[] = [
			{ title: 'Home', path: '/', isActive: false },
			{ title: 'Admin', path: '/admin', isActive: false },
			{ title: 'Users', path: '/admin/users', isActive: false },
			{ title: 'User Details', path: '/admin/users/123', isActive: true },
		]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		const links = screen.getAllByRole('link')
		expect(links).toHaveLength(3)
		expect(links[0]).toHaveAttribute('href', '/')
		expect(links[1]).toHaveAttribute('href', '/admin')
		expect(links[2]).toHaveAttribute('href', '/admin/users')

		const currentPage = screen.getByText('User Details')
		expect(currentPage).toHaveAttribute('aria-current', 'page')
	})

	it('should display breadcrumb with special characters in titles', async () => {
		const breadcrumbs: BreadcrumbItem[] = [
			{ title: 'Home & Dashboard', path: '/', isActive: false },
			{ title: 'User Settings (Admin)', path: '/settings', isActive: true },
		]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		expect(screen.getByText(/Home & Dashboard/)).toBeInTheDocument()
		expect(screen.getByText(/User Settings \(Admin\)/)).toBeInTheDocument()
	})

	it('should render separator icons between breadcrumb items', async () => {
		const breadcrumbs: BreadcrumbItem[] = [
			{ title: 'Home', path: '/', isActive: false },
			{ title: 'Settings', path: '/settings', isActive: true },
		]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		const separators = screen.getAllByRole('listitem')
		expect(separators.length).toBeGreaterThan(2)
	})

	it('should have proper accessibility attributes for navigation', async () => {
		const breadcrumbs: BreadcrumbItem[] = [
			{ title: 'Home', path: '/', isActive: false },
			{ title: 'Products', path: '/products', isActive: false },
			{ title: 'Electronics', path: '/products/electronics', isActive: true },
		]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
		expect(nav).toHaveAttribute('aria-label', 'Breadcrumb')
		expect(nav).toHaveClass('flex', 'items-center', 'gap-1')
	})

	it('should apply correct styling to active breadcrumb item', async () => {
		const breadcrumbs: BreadcrumbItem[] = [
			{ title: 'Home', path: '/', isActive: false },
			{ title: 'Current Page', path: '/current', isActive: true },
		]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		const currentPage = screen.getByText('Current Page')
		expect(currentPage).toHaveClass('text-sm', 'font-medium', 'text-foreground')
	})

	it('should apply correct styling to inactive breadcrumb links', async () => {
		const breadcrumbs: BreadcrumbItem[] = [
			{ title: 'Home', path: '/', isActive: false },
			{ title: 'Current', path: '/current', isActive: true },
		]

		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
		})

		const homeLink = screen.getByRole('link', { name: /home/i })
		expect(homeLink).toHaveClass('text-sm', 'font-medium', 'text-muted-foreground')
		expect(homeLink).toHaveClass('hover:text-foreground')
	})

	it('should handle empty breadcrumbs gracefully', async () => {
		await render(Breadcrumb, {
			providers: [...defaultProviders(), createNavigationWithBreadcrumbs([])],
		})

		const nav = screen.getByRole('navigation', { name: /breadcrumb/i })
		expect(nav).toBeInTheDocument()

		const listItems = screen.queryAllByRole('listitem')
		expect(listItems).toHaveLength(0)
	})

	describe('intermediate-item hiding below sm:', () => {
		// jsdom cannot evaluate media queries. These tests assert the class-presence regression guard
		// for the sm: viewport-aware visibility rules. Visual behaviour is covered by the
		// `MobileEllipsis` Storybook story at 375 px.

		it('should not render an ellipsis when the trail has 1 item', async () => {
			const breadcrumbs: BreadcrumbItem[] = [{ title: 'Home', path: '/', isActive: true }]

			await render(Breadcrumb, {
				providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
			})

			expect(screen.queryByText('…')).not.toBeInTheDocument()
		})

		it('should not render an ellipsis when the trail has 2 items', async () => {
			const breadcrumbs: BreadcrumbItem[] = [
				{ title: 'Home', path: '/', isActive: false },
				{ title: 'Settings', path: '/settings', isActive: true },
			]

			await render(Breadcrumb, {
				providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
			})

			expect(screen.queryByText('…')).not.toBeInTheDocument()
		})

		it('should render an ellipsis marked sm:hidden when the trail has 3+ items', async () => {
			const breadcrumbs: BreadcrumbItem[] = [
				{ title: 'Home', path: '/', isActive: false },
				{ title: 'Admin', path: '/admin', isActive: false },
				{ title: 'Settings', path: '/settings', isActive: true },
			]

			await render(Breadcrumb, {
				providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
			})

			const ellipsis = screen.getByText('…')
			expect(ellipsis).toBeInTheDocument()
			expect(ellipsis.closest('li')).toHaveClass('sm:hidden')
		})

		it('should mark intermediate items hidden sm:inline-flex when the trail has 4 items', async () => {
			const breadcrumbs: BreadcrumbItem[] = [
				{ title: 'Home', path: '/', isActive: false },
				{ title: 'Admin', path: '/admin', isActive: false },
				{ title: 'Users', path: '/admin/users', isActive: false },
				{ title: 'User Details', path: '/admin/users/123', isActive: true },
			]

			await render(Breadcrumb, {
				providers: [...defaultProviders(), createNavigationWithBreadcrumbs(breadcrumbs)],
			})

			// Intermediate items (Admin and Users) sit inside an <li> marked hidden sm:inline-flex.
			const adminLi = screen.getByRole('link', { name: /admin/i }).closest('li')
			const usersLi = screen.getByRole('link', { name: /users/i }).closest('li')
			expect(adminLi).toHaveClass('hidden')
			expect(adminLi).toHaveClass('sm:inline-flex')
			expect(usersLi).toHaveClass('hidden')
			expect(usersLi).toHaveClass('sm:inline-flex')

			// First and last entries stay visible at all viewports — no hidden class.
			const homeLi = screen.getByRole('link', { name: /home/i }).closest('li')
			const lastLi = screen.getByText('User Details').closest('li')
			expect(homeLi).not.toHaveClass('hidden')
			expect(lastLi).not.toHaveClass('hidden')
		})
	})
})
