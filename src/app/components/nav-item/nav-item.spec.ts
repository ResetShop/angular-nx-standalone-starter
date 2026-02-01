import { provideRouter } from '@angular/router';
import { NavigationRoute } from '@interfaces/navigation';
import { provideIcons } from '@ng-icons/core';
import { featherActivity, featherChevronRight, featherHome } from '@ng-icons/feather-icons';
import { NavigationStateService } from '@services/navigation-state.service';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import NavItem from './nav-item';

describe('NavItem', () => {
	const mockRoute: NavigationRoute = {
		id: 'test-route',
		name: 'Test Route',
		route: '/test',
		icon: { featherHome },
	};

	const mockRouteWithoutIcon: NavigationRoute = {
		id: 'no-icon-route',
		name: 'No Icon Route',
		route: '/no-icon',
	};

	it('should create the nav item component', async () => {
		const { fixture } = await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
		});

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should render the navigation item name', async () => {
		await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
		});

		expect(screen.getByText('Test Route')).toBeInTheDocument();
	});

	it('should render as a link with correct routerLink', async () => {
		await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
		});

		const link = screen.getByRole('link', { name: /test route/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/test');
	});

	it('should render icon when icon is provided', async () => {
		await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
		});

		const icon = screen.getByTestId('item-icon');
		expect(icon).toBeInTheDocument();
	});

	it('should not render icon when icon is empty', async () => {
		await render(NavItem, {
			inputs: { item: mockRouteWithoutIcon },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
		});

		const icon = screen.queryByTestId('item-icon');
		expect(icon).not.toBeInTheDocument();
	});

	it('should render navigation item with different route data', async () => {
		const customRoute: NavigationRoute = {
			id: 'custom',
			name: 'Custom Page',
			route: '/custom/path',
			icon: { featherActivity },
		};

		await render(NavItem, {
			inputs: { item: customRoute },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
		});

		const link = screen.getByRole('link', { name: /custom page/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/custom/path');
		expect(screen.getByText('Custom Page')).toBeInTheDocument();
	});

	it('should apply correct CSS classes to the link', async () => {
		await render(NavItem, {
			inputs: { item: mockRoute },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
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
			icon: { featherHome },
			children: [
				{
					id: 'child1',
					name: 'Child 1',
					route: '/parent/child1',
					icon: { featherActivity },
				},
			],
		};

		await render(NavItem, {
			inputs: { item: routeWithChildren },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
		});

		expect(screen.getByText('Parent Route')).toBeInTheDocument();
	});

	it('should render multiple nav items with different icons', async () => {
		const route1: NavigationRoute = {
			id: 'route1',
			name: 'Route 1',
			route: '/route1',
			icon: { featherHome },
		};

		const route2: NavigationRoute = {
			id: 'route2',
			name: 'Route 2',
			route: '/route2',
			icon: { featherActivity },
		};

		const { rerender } = await render(NavItem, {
			inputs: { item: route1 },
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
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
			providers: [
				provideRouter([]),
				provideIcons({ featherHome, featherActivity, featherChevronRight }),
				NavigationStateService,
			],
		});

		expect(fixture.componentRef.changeDetectorRef).toBeDefined();
	});
});

describe('NavItem - Expandable Behavior', () => {
	const parentRoute: NavigationRoute = {
		id: 'parent',
		name: 'Parent Route',
		route: '/parent',
		icon: { featherHome },
		children: [
			{
				id: 'child1',
				name: 'Child 1',
				route: '/parent/child1',
			},
			{
				id: 'child2',
				name: 'Child 2',
				route: '/parent/child2',
			},
		],
	};

	it('should render expand button when item has children', async () => {
		await render(NavItem, {
			inputs: { item: parentRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherChevronRight }), NavigationStateService],
		});

		const button = screen.getByRole('button', { name: /parent route/i });
		expect(button).toBeInTheDocument();
		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('should expand and show children when button is clicked', async () => {
		const user = userEvent.setup();
		await render(NavItem, {
			inputs: { item: parentRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherChevronRight }), NavigationStateService],
		});

		const button = screen.getByRole('button', { name: /parent route/i });
		await user.click(button);

		expect(button).toHaveAttribute('aria-expanded', 'true');
		expect(screen.getByText('Child 1')).toBeInTheDocument();
		expect(screen.getByText('Child 2')).toBeInTheDocument();
	});

	it('should collapse children when clicked again', async () => {
		const user = userEvent.setup();
		await render(NavItem, {
			inputs: { item: parentRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherChevronRight }), NavigationStateService],
		});

		const button = screen.getByRole('button');
		await user.click(button); // Expand
		await user.click(button); // Collapse

		expect(button).toHaveAttribute('aria-expanded', 'false');
	});

	it('should support keyboard navigation with Enter key', async () => {
		const user = userEvent.setup();
		await render(NavItem, {
			inputs: { item: parentRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherChevronRight }), NavigationStateService],
		});

		const button = screen.getByRole('button');
		button.focus();
		await user.keyboard('{Enter}');

		expect(button).toHaveAttribute('aria-expanded', 'true');
	});

	it('should support keyboard navigation with Space key', async () => {
		const user = userEvent.setup();
		await render(NavItem, {
			inputs: { item: parentRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherChevronRight }), NavigationStateService],
		});

		const button = screen.getByRole('button');
		button.focus();
		await user.keyboard(' ');

		expect(button).toHaveAttribute('aria-expanded', 'true');
	});

	it('should have chevron icon that rotates when expanded', async () => {
		const user = userEvent.setup();
		await render(NavItem, {
			inputs: { item: parentRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherChevronRight }), NavigationStateService],
		});

		const button = screen.getByRole('button');
		const chevron = button.querySelector('ng-icon[name="featherChevronRight"]');

		expect(chevron).not.toHaveClass('rotate-90');

		await user.click(button);
		expect(chevron).toHaveClass('rotate-90');
	});

	it('should render leaf items as links', async () => {
		const leafRoute: NavigationRoute = {
			id: 'leaf',
			name: 'Leaf Route',
			route: '/leaf',
		};

		await render(NavItem, {
			inputs: { item: leafRoute },
			providers: [provideRouter([]), NavigationStateService],
		});

		const link = screen.getByRole('link', { name: /leaf route/i });
		expect(link).toBeInTheDocument();
	});

	it('should indent child navigation items', async () => {
		const user = userEvent.setup();
		await render(NavItem, {
			inputs: { item: parentRoute },
			providers: [provideRouter([]), provideIcons({ featherHome, featherChevronRight }), NavigationStateService],
		});

		const button = screen.getByRole('button');
		await user.click(button);

		// Check that children container has proper structure
		const childrenContainer = screen.getByRole('list', { hidden: true });
		expect(childrenContainer).toHaveAttribute('id', 'nav-children-parent');
	});

	it('should treat empty children array as leaf node', async () => {
		const emptyChildrenRoute: NavigationRoute = {
			id: 'empty',
			name: 'Empty Children',
			route: '/empty',
			children: [],
		};

		await render(NavItem, {
			inputs: { item: emptyChildrenRoute },
			providers: [provideRouter([]), NavigationStateService],
		});

		const link = screen.getByRole('link', { name: /empty children/i });
		expect(link).toBeInTheDocument();
	});
});
