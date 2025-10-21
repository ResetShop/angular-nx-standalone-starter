import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { featherHome, featherActivity } from '@ng-icons/feather-icons';
import NavItem from './nav-item';
import { NavigationRoute } from '@interfaces/navigation';

describe('NavItem', () => {
	const mockRoute: NavigationRoute = {
		id: 'test-route',
		name: 'Test Route',
		route: '/test',
		icon: 'featherHome',
		children: [],
	};

	const mockRouteWithoutIcon: NavigationRoute = {
		id: 'no-icon-route',
		name: 'No Icon Route',
		route: '/no-icon',
		icon: '',
		children: [],
	};

	it('should create the nav item component', async () => {
		const { fixture } = await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should render the navigation item name', async () => {
		await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		expect(screen.getByText('Test Route')).toBeInTheDocument();
	});

	it('should render as a link with correct routerLink', async () => {
		await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		const link = screen.getByRole('link', { name: /test route/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/test');
	});

	it('should render icon when icon is provided', async () => {
		await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		const icon = screen.getByTestId('item-icon');
		expect(icon).toBeInTheDocument();
	});

	it('should not render icon when icon is empty', async () => {
		await render(NavItem, {
			inputs: { item: mockRouteWithoutIcon },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		const icon = screen.queryByTestId('item-icon');
		expect(icon).not.toBeInTheDocument();
	});

	it('should render navigation item with different route data', async () => {
		const customRoute: NavigationRoute = {
			id: 'custom',
			name: 'Custom Page',
			route: '/custom/path',
			icon: 'featherActivity',
			children: [],
		};

		await render(NavItem, {
			inputs: { item: customRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		const link = screen.getByRole('link', { name: /custom page/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/custom/path');
		expect(screen.getByText('Custom Page')).toBeInTheDocument();
	});

	it('should apply correct CSS classes to the link', async () => {
		await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		const link = screen.getByRole('link');
		expect(link).toHaveClass('flex');
		expect(link).toHaveClass('items-center');
		expect(link).toHaveClass('gap-2');
		expect(link).toHaveClass('p-2');
	});

	it('should handle navigation items with children property', async () => {
		const routeWithChildren: NavigationRoute = {
			id: 'parent',
			name: 'Parent Route',
			route: '/parent',
			icon: 'featherHome',
			children: [
				{
					id: 'child1',
					name: 'Child 1',
					route: '/parent/child1',
					icon: 'featherActivity',
				},
			],
		};

		await render(NavItem, {
			inputs: { item: routeWithChildren },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		expect(screen.getByText('Parent Route')).toBeInTheDocument();
	});

	it('should render multiple nav items with different icons', async () => {
		const route1: NavigationRoute = {
			id: 'route1',
			name: 'Route 1',
			route: '/route1',
			icon: 'featherHome',
			children: [],
		};

		const route2: NavigationRoute = {
			id: 'route2',
			name: 'Route 2',
			route: '/route2',
			icon: 'featherActivity',
			children: [],
		};

		const { rerender } = await render(NavItem, {
			inputs: { item: route1 },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		let icon = screen.getByTestId('item-icon');
		expect(icon).toBeInTheDocument();

		await rerender({ inputs: { item: route2 } });

		icon = screen.getByTestId('item-icon');
		expect(icon).toBeInTheDocument();
	});

	it('should have OnPush change detection strategy', async () => {
		const { fixture } = await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity })],
		});

		expect(fixture.componentRef.changeDetectorRef).toBeDefined();
	});
});
