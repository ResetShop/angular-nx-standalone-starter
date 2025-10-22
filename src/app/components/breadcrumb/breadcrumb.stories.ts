import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { Breadcrumb } from './breadcrumb';

const createMockActivatedRoute = (title: string | undefined, path: string, children: any[] = []) => ({
	routeConfig: {
		title,
		path,
	},
	children,
	outlet: 'primary',
});

const createMockRouter = (navigationPath: string) => {
	const eventsSubject = new Subject<NavigationEnd>();
	// Emit initial navigation event to trigger breadcrumb building
	setTimeout(() => {
		eventsSubject.next(new NavigationEnd(1, navigationPath, ''));
	}, 0);
	return {
		events: eventsSubject.asObservable(),
		navigateByUrl: () => Promise.resolve(true),
	};
};

const meta: Meta<Breadcrumb> = {
	component: Breadcrumb,
	title: 'Components/Breadcrumb',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			providers: [],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A breadcrumb navigation component that displays the hierarchical path to the current page. It automatically extracts breadcrumb items from the active route and its parent routes using Angular's native routing APIs.

## Features

- **Automatic Route Tracking**: Displays breadcrumbs based on the current route and its parent routes
- **Native Angular Router**: Uses the Route \`title\` property to configure breadcrumb labels
- **Navigable**: Click any breadcrumb item to navigate back to that route
- **Accessible**: Full ARIA support with proper semantic HTML
- **Responsive**: Wraps breadcrumb items on smaller screens
- **Dark Mode Support**: Automatic dark mode styling with Tailwind CSS
- **Icon Separators**: Uses chevron icons as visual separators
- **Current Page Indicator**: Highlights the active/current page

## Route Configuration

Routes must have a \`title\` property to appear in breadcrumbs:

\`\`\`typescript
const routes: Route[] = [
  {
    path: 'dashboard',
    title: 'Dashboard',
    component: DashboardComponent,
    children: [
      {
        path: 'health',
        title: 'Health',
        component: HealthComponent,
      }
    ]
  }
];
\`\`\`

## Usage

\`\`\`typescript
import { Breadcrumb } from '@components/breadcrumb';

@Component({
  imports: [Breadcrumb],
  template: \`
    <nav class="border-b p-4">
      <app-breadcrumb />
    </nav>
  \`
})
\`\`\`
			`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
};

export default meta;

type Story = StoryObj<Breadcrumb>;

/**
 * Single breadcrumb item displaying the current page.
 * Useful for top-level or root pages.
 */
export const SingleItem: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/dashboard'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [createMockActivatedRoute('Dashboard', 'dashboard', [])]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: '<app-breadcrumb />',
	}),
};

/**
 * Multiple breadcrumb items showing the hierarchical path.
 * Typical scenario with nested routes.
 */
export const MultipleItems: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/dashboard/health'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [createMockActivatedRoute('Health', 'health', [])]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: '<app-breadcrumb />',
	}),
};

/**
 * Deep nested breadcrumb path with multiple levels.
 * Shows how breadcrumbs display longer hierarchies.
 */
export const DeepNesting: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/dashboard/settings/profile/edit'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Settings', 'settings', [
									createMockActivatedRoute('Profile', 'profile', [createMockActivatedRoute('Edit', 'edit', [])]),
								]),
							]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: '<app-breadcrumb />',
	}),
};

/**
 * Breadcrumb with long titles demonstrating text wrapping.
 */
export const LongTitles: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/user-management/profile-settings'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('User Management Dashboard', 'user-management', [
								createMockActivatedRoute('User Profile Settings', 'profile-settings', []),
							]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: '<div class="max-w-2xl"><app-breadcrumb /></div>',
	}),
};

/**
 * Breadcrumb with special characters and various text styles.
 */
export const SpecialCharacters: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/home/user'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Home & Dashboard', 'home', [
								createMockActivatedRoute('User (Admin)', 'user', []),
							]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: '<app-breadcrumb />',
	}),
};

/**
 * Breadcrumb in a light theme container.
 * Demonstrates the light mode styling.
 */
export const LightTheme: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/dashboard/analytics'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Analytics', 'analytics', []),
							]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: `
			<div class="bg-white p-4 rounded-lg">
				<app-breadcrumb />
			</div>
		`,
	}),
};

/**
 * Breadcrumb in a dark theme container.
 * Demonstrates the dark mode styling with proper contrast.
 */
export const DarkTheme: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/dashboard/reports'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [createMockActivatedRoute('Reports', 'reports', [])]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: `
			<div class="dark bg-black p-4 rounded-lg">
				<app-breadcrumb />
			</div>
		`,
	}),
};

/**
 * Breadcrumb within a typical page header layout.
 * Shows the breadcrumb in context with other navigation elements.
 */
export const InPageHeader: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/dashboard/users/view'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Users', 'users', [createMockActivatedRoute('View', 'view', [])]),
							]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: `
			<header class="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black/95 p-4">
				<div class="flex items-center justify-between mb-4">
					<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-50">Page Title</h1>
				</div>
				<app-breadcrumb />
			</header>
		`,
	}),
};

/**
 * Breadcrumb with responsive behavior.
 * Demonstrates how breadcrumbs wrap on smaller screens.
 */
export const Responsive: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/admin/settings/advanced'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Admin Dashboard & Configuration', 'admin', [
								createMockActivatedRoute('System Settings', 'settings', [
									createMockActivatedRoute('Advanced Options', 'advanced', []),
								]),
							]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: `
			<div class="max-w-sm">
				<p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Small screen (max-width: 24rem)</p>
				<app-breadcrumb />
			</div>
		`,
	}),
};

/**
 * Example showing all breadcrumb variations in one view.
 * Useful for design documentation and testing.
 */
export const AllStates: Story = {
	decorators: [
		moduleMetadata({
			providers: [
				{
					provide: Router,
					useValue: createMockRouter('/dashboard/reports'),
				},
				{
					provide: ActivatedRoute,
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [createMockActivatedRoute('Reports', 'reports', [])]),
						]),
					},
				},
			],
		}),
	],
	render: () => ({
		template: `
			<div class="space-y-8">
				<div>
					<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Light Theme</h3>
					<div class="bg-white p-4 rounded border border-gray-200">
						<app-breadcrumb />
					</div>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-gray-900 dark:text-gray-50 mb-2">Dark Theme</h3>
					<div class="dark bg-black p-4 rounded border border-gray-800">
						<app-breadcrumb />
					</div>
				</div>
			</div>
		`,
	}),
};
