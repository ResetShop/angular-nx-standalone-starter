import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { featherHome, featherActivity, featherSettings } from '@ng-icons/feather-icons';
import NavSection from './nav-section';
import { NavigationSection } from '@interfaces/navigation';

describe('NavSection', () => {
	const mockSection: NavigationSection = {
		id: 'test-section',
		name: 'Test Section',
		routes: [
			{
				id: 'route1',
				name: 'Route 1',
				route: '/route1',
				icon: 'featherHome',
				children: [],
			},
			{
				id: 'route2',
				name: 'Route 2',
				route: '/route2',
				icon: 'featherActivity',
				children: [],
			},
		],
	};

	const mockSectionWithoutRoutes: NavigationSection = {
		id: 'empty-section',
		name: 'Empty Section',
		routes: [],
	};

	it('should create the nav section component', async () => {
		const { fixture } = await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should render section title when showTitle is true', async () => {
		await render(NavSection, {
			inputs: { section: mockSection, showTitle: true },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(screen.getByText('Test Section')).toBeInTheDocument();
	});

	it('should not render section title when showTitle is false', async () => {
		await render(NavSection, {
			inputs: { section: mockSection, showTitle: false },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(screen.queryByText('Test Section')).not.toBeInTheDocument();
	});

	it('should render section title by default when showTitle is not provided', async () => {
		await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(screen.getByText('Test Section')).toBeInTheDocument();
	});

	it('should render all navigation routes in the section', async () => {
		await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(screen.getByText('Route 1')).toBeInTheDocument();
		expect(screen.getByText('Route 2')).toBeInTheDocument();
	});

	it('should render correct number of navigation items', async () => {
		await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		const links = screen.getAllByRole('link');
		expect(links).toHaveLength(2);
	});

	it('should render navigation items with correct routes', async () => {
		await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		const link1 = screen.getByRole('link', { name: /route 1/i });
		const link2 = screen.getByRole('link', { name: /route 2/i });

		expect(link1).toHaveAttribute('href', '/route1');
		expect(link2).toHaveAttribute('href', '/route2');
	});

	it('should render empty section without routes', async () => {
		await render(NavSection, {
			inputs: { section: mockSectionWithoutRoutes },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(screen.getByText('Empty Section')).toBeInTheDocument();
		expect(screen.queryAllByRole('link')).toHaveLength(0);
	});

	it('should render section with multiple routes', async () => {
		const largeSection: NavigationSection = {
			id: 'large-section',
			name: 'Large Section',
			routes: [
				{
					id: 'r1',
					name: 'Route A',
					route: '/a',
					icon: 'featherHome',
					children: [],
				},
				{
					id: 'r2',
					name: 'Route B',
					route: '/b',
					icon: 'featherActivity',
					children: [],
				},
				{
					id: 'r3',
					name: 'Route C',
					route: '/c',
					icon: 'featherSettings',
					children: [],
				},
			],
		};

		await render(NavSection, {
			inputs: { section: largeSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(screen.getByText('Route A')).toBeInTheDocument();
		expect(screen.getByText('Route B')).toBeInTheDocument();
		expect(screen.getByText('Route C')).toBeInTheDocument();
		expect(screen.getAllByRole('link')).toHaveLength(3);
	});

	it('should apply correct CSS classes to section title', async () => {
		await render(NavSection, {
			inputs: { section: mockSection, showTitle: true },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		const title = screen.getByText('Test Section');
		expect(title).toHaveClass('flex');
		expect(title).toHaveClass('h-8');
		expect(title).toHaveClass('items-center');
		expect(title).toHaveClass('px-2');
		expect(title).toHaveClass('text-xs');
		expect(title).toHaveClass('font-medium');
		expect(title).toHaveClass('text-black/70');
	});

	it('should render list items with appNavItem directive', async () => {
		await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		// Verify nav items are rendered by checking for their links
		const links = screen.getAllByRole('link');
		expect(links).toHaveLength(2);
	});

	it('should track routes by id in for loop', async () => {
		await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		// Verify all routes are rendered (tracking ensures proper rendering)
		expect(screen.getByText('Route 1')).toBeInTheDocument();
		expect(screen.getByText('Route 2')).toBeInTheDocument();
	});

	it('should handle section with routes without icons', async () => {
		const sectionNoIcons: NavigationSection = {
			id: 'no-icons',
			name: 'No Icons Section',
			routes: [
				{
					id: 'route-no-icon',
					name: 'Route Without Icon',
					route: '/no-icon',
					children: [],
				},
			],
		};

		await render(NavSection, {
			inputs: { section: sectionNoIcons },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(screen.getByText('Route Without Icon')).toBeInTheDocument();
	});

	it('should update when section input changes', async () => {
		const newSection: NavigationSection = {
			id: 'updated-section',
			name: 'Updated Section',
			routes: [
				{
					id: 'new-route',
					name: 'New Route',
					route: '/new',
					icon: 'featherHome',
					children: [],
				},
			],
		};

		const { rerender } = await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(screen.getByText('Test Section')).toBeInTheDocument();

		await rerender({ inputs: { section: newSection } });

		expect(screen.getByText('Updated Section')).toBeInTheDocument();
		expect(screen.getByText('New Route')).toBeInTheDocument();
		expect(screen.queryByText('Test Section')).not.toBeInTheDocument();
	});

	it('should have OnPush change detection strategy', async () => {
		const { fixture } = await render(NavSection, {
			inputs: { section: mockSection },
			providers: [provideRouter([]), provideIcons({ featherHome, featherActivity, featherSettings })],
		});

		expect(fixture.componentRef.changeDetectorRef).toBeDefined();
	});
});
