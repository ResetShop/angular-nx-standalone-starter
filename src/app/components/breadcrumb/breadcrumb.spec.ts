import { render, screen, waitFor } from '@testing-library/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { RouterTestingHarness } from '@angular/router/testing';
import { Breadcrumb } from '@components/breadcrumb/breadcrumb';

// Mock components for routes
@Component({
	selector: 'app-home-page',
	standalone: true,
	template: '<div>Home Page</div>',
})
class HomePageComponent {}

@Component({
	selector: 'app-health-page',
	standalone: true,
	template: '<div>Health Page</div>',
})
class HealthPageComponent {}

@Component({
	selector: 'app-dashboard-page',
	standalone: true,
	template: '<app-breadcrumb /><router-outlet/>',
	imports: [RouterOutlet, Breadcrumb],
})
class MockDashboardComponentPage {}

@Component({
	selector: 'app-detail-page',
	standalone: true,
	template: '<div>Detail Page</div>',
})
class DetailPageComponent {}

@Component({
	selector: 'app-settings-page',
	standalone: true,
	template: '<div>Settings Page</div>',
})
class SettingsPageComponent {}

@Component({
	selector: 'app-admin-page',
	standalone: true,
	template: '<div>Admin Page</div>',
})
class AdminPageComponent {}

@Component({
	selector: 'app-test-page',
	standalone: true,
	template: '<div>Test Page</div>',
})
class TestPageComponent {}

@Component({
	selector: 'app-current-page',
	standalone: true,
	template: '<div>Current Page</div>',
})
class CurrentPageComponent {}

@Component({
	selector: 'app-root-page',
	standalone: true,
	template: '<div>Root Page</div>',
})
class RootPageComponent {}

describe('Breadcrumb', () => {
	it('should render breadcrumb navigation element', async () => {
		await render(MockDashboardComponentPage, {
			providers: [provideRouter([])],
		});

		const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
		expect(nav).toBeInTheDocument();
	});

	it('should render breadcrumb list', async () => {
		await render(MockDashboardComponentPage, {
			providers: [provideRouter([])],
		});

		const list = screen.getByRole('list', { hidden: true });
		expect(list).toBeInTheDocument();
	});

	it('should display single breadcrumb item on navigation', async () => {
		const routes = [
			{
				path: '',
				title: 'Dashboard',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'home',
						title: 'Home Route',
						component: HomePageComponent,
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/home', MockDashboardComponentPage);

		await waitFor(() => {
			const breadcrumbItem = screen.getByText('Home Route');
			expect(breadcrumbItem).toBeInTheDocument();
		});
	});

	it('should mark last breadcrumb as active', async () => {
		const routes = [
			{
				path: '',
				title: 'Dashboard',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'health',
						title: 'Health Route',
						component: HealthPageComponent,
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/health', MockDashboardComponentPage);

		await waitFor(() => {
			const activeItem = screen.getByText('Health Route', {
				selector: 'span[aria-current="page"]',
			});
			expect(activeItem).toHaveAttribute('aria-current', 'page');
		});
	});

	it('should render inactive breadcrumbs as links', async () => {
		const routes = [
			{
				path: 'dashboard',
				title: 'Dashboard Route',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'detail',
						title: 'Detail Route',
						component: DetailPageComponent,
						children: [
							{
								path: 'settings',
								title: 'Settings Route',
								component: SettingsPageComponent,
							},
						],
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/dashboard/detail/settings', MockDashboardComponentPage);

		await waitFor(() => {
			const link = screen.getByRole('link', { name: /dashboard route/i });
			expect(link).toHaveAttribute('href', '/dashboard');
			expect(link).not.toHaveAttribute('aria-current', 'page');
		});

		await waitFor(() => {
			const link = screen.getByRole('link', { name: /detail route/i });
			expect(link).toHaveAttribute('href', '/dashboard/detail');
			expect(link).not.toHaveAttribute('aria-current', 'page');
		});
	});

	it('should navigate when breadcrumb link is clicked', async () => {
		const routes = [
			{
				path: 'dashboard',
				title: 'Dashboard Route',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'detail',
						title: 'Detail Route',
						component: DetailPageComponent,
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/dashboard/detail', MockDashboardComponentPage);

		await waitFor(() => {
			expect(harness.routeNativeElement?.textContent).toContain('Detail Route');
		});

		await waitFor(() => {
			expect(harness.routeNativeElement?.textContent).toContain('Dashboard Route');
		});

		const link = screen.getByRole('link', { name: /dashboard/i });
		link.click();

		await waitFor(() => {
			expect(harness.routeNativeElement?.textContent).toContain('Dashboard Route');
		});

		await waitFor(() => {
			expect(harness.routeNativeElement?.textContent).not.toContain('Detail Route');
		});
	});

	it('should display multiple breadcrumb levels', async () => {
		const routes = [
			{
				path: 'dashboard',
				title: 'Dashboard Route',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'admin',
						title: 'Admin Route',
						component: AdminPageComponent,
						children: [
							{
								path: 'settings',
								title: 'Settings Route',
								component: SettingsPageComponent,
							},
						],
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/dashboard/admin/settings', MockDashboardComponentPage);

		await waitFor(() => {
			expect(screen.getByText('Dashboard Route')).toBeInTheDocument();
			expect(screen.getByText('Admin Route')).toBeInTheDocument();
			expect(
				screen.getByText('Settings Route', {
					selector: 'span[aria-current="page"]',
				}),
			).toBeInTheDocument();
		});
	});

	it('should have proper accessibility attributes', async () => {
		const routes = [
			{
				path: 'dashboard',
				title: 'Dashboard Route',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'health',
						title: 'Health Route',
						component: HealthPageComponent,
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/dashboard/health', MockDashboardComponentPage);

		await waitFor(() => {
			const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
			expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');

			const currentPageSpan = screen.getByText('Health Route', {
				selector: 'span[aria-current="page"]',
			});
			expect(currentPageSpan).toHaveAttribute('aria-current', 'page');
		});
	});

	it('should apply correct styling classes to nav', async () => {
		const routes = [
			{
				path: '',
				title: 'Home',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'test',
						title: 'Test Page',
						component: TestPageComponent,
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/test', MockDashboardComponentPage);

		await waitFor(() => {
			const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
			expect(nav).toHaveClass('flex', 'items-center', 'gap-1');
		});
	});

	it('should apply active styling to current page', async () => {
		const routes = [
			{
				path: '',
				title: 'Root',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'current',
						title: 'Current Route',
						component: CurrentPageComponent,
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/current', MockDashboardComponentPage);

		await waitFor(() => {
			const activeSpan = screen.getByText('Current Route', {
				selector: 'span[aria-current="page"]',
			});
			expect(activeSpan).toHaveClass('text-sm', 'font-medium', 'text-gray-900', 'dark:text-gray-50');
		});
	});

	it('should apply link styling to inactive breadcrumbs', async () => {
		const routes = [
			{
				path: 'dashboard',
				title: 'Dashboard',
				component: MockDashboardComponentPage,
				children: [
					{
						path: 'detail',
						title: 'Detail',
						component: DetailPageComponent,
					},
				],
			},
		];

		await render(MockDashboardComponentPage, {
			providers: [provideRouter(routes)],
		});

		const harness = await RouterTestingHarness.create();
		await harness.navigateByUrl('/dashboard/detail', MockDashboardComponentPage);

		await waitFor(() => {
			const link = screen.getByRole('link', { name: /dashboard/i });
			expect(link).toHaveClass('text-sm', 'font-medium', 'text-gray-500', 'hover:text-gray-700');
		});
	});
});
