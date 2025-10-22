import type { Meta, StoryObj } from '@storybook/angular';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { Header } from './header';

const createMockActivatedRoute = (title: string | undefined, path: string, children: any[] = []) => ({
	routeConfig: {
		title,
		path,
	},
	children,
	outlet: 'primary',
});

const meta: Meta<Header> = {
	component: Header,
	title: 'Components/Header',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: `
The Header component serves as the navigation header for the dashboard layout. It displays breadcrumb navigation showing the hierarchical path to the current page.

## Features

- **Breadcrumb Navigation**: Displays the path to the current page
- **Route-based**: Automatically updates based on the active route
- **Responsive**: Adapts to different screen sizes
- **Accessible**: Full semantic HTML and ARIA support
- **Dark Mode Support**: Automatic dark mode styling

## Usage

\`\`\`typescript
import { Header } from '@components/header';

@Component({
  imports: [Header],
  template: \`
    <header class="border-b">
      <app-header />
    </header>
  \`
})
\`\`\`

## Layout Integration

The Header component is typically used in the dashboard layout:

\`\`\`typescript
@Component({
  template: \`
    <aside class="sidebar">
      <app-sidebar />
    </aside>
    <nav class="header-nav">
      <app-header />
    </nav>
    <main class="content">
      <router-outlet />
    </main>
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

type Story = StoryObj<Header>;

/**
 * Default header with a simple breadcrumb trail.
 */
export const Default: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [createMockActivatedRoute('Health', 'health', [])]),
						]),
					},
				},
			],
			template: '<app-header />',
		};
	},
};

/**
 * Header displaying a single-level breadcrumb (root page).
 */
export const SingleLevelBreadcrumb: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [createMockActivatedRoute('Dashboard', 'dashboard', [])]),
					},
				},
			],
			template: '<app-header />',
		};
	},
};

/**
 * Header with multi-level nested breadcrumbs.
 */
export const MultiLevelBreadcrumb: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Settings', 'settings', [createMockActivatedRoute('Profile', 'profile', [])]),
							]),
						]),
					},
				},
			],
			template: '<app-header />',
		};
	},
};

/**
 * Header in the full dashboard layout context.
 */
export const InDashboardLayout: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Analytics', 'analytics', []),
							]),
						]),
					},
				},
			],
			template: `
				<div class="grid h-screen gap-0" style="grid-template-columns: 240px 1fr; grid-template-rows: 64px 1fr;">
					<aside class="col-span-1 row-span-2 border-r border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-black/90">
						<div class="p-4">
							<p class="text-xs text-gray-500 dark:text-gray-400">Sidebar</p>
						</div>
					</aside>
					<nav class="border-b border-gray-200 p-2 dark:border-gray-800 dark:bg-black/95">
						<div class="flex h-full items-center dark:text-gray-50">
							<app-header />
						</div>
					</nav>
					<main class="bg-white p-4 dark:bg-black/95">
						<p class="text-sm text-gray-600 dark:text-gray-400">Main content area</p>
					</main>
				</div>
			`,
		};
	},
};

/**
 * Header with light theme styling.
 */
export const LightTheme: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [createMockActivatedRoute('Users', 'users', [])]),
						]),
					},
				},
			],
			template: `
				<header class="border-b border-gray-200 bg-white p-4">
					<app-header />
				</header>
			`,
		};
	},
};

/**
 * Header with dark theme styling.
 */
export const DarkTheme: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Settings', 'settings', []),
							]),
						]),
					},
				},
			],
			template: `
				<div class="dark">
					<header class="border-b border-gray-800 bg-black/95 p-4">
						<app-header />
					</header>
				</div>
			`,
		};
	},
};

/**
 * Header on a narrow viewport simulating mobile.
 */
export const MobileViewport: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('User Management', 'user-management', []),
							]),
						]),
					},
				},
			],
			template: `
				<div style="max-width: 375px; border: 1px solid #ccc;">
					<header class="border-b border-gray-200 p-2 dark:border-gray-800 dark:bg-black/95">
						<app-header />
					</header>
				</div>
			`,
		};
	},
	parameters: {
		viewport: {
			defaultViewport: 'mobile1',
		},
	},
};

/**
 * Header on a tablet viewport.
 */
export const TabletViewport: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Reports', 'reports', [createMockActivatedRoute('Sales', 'sales', [])]),
							]),
						]),
					},
				},
			],
			template: `
				<div style="max-width: 768px;">
					<header class="border-b border-gray-200 p-3 dark:border-gray-800 dark:bg-black/95">
						<app-header />
					</header>
				</div>
			`,
		};
	},
};

/**
 * Header with very deep breadcrumb nesting.
 */
export const DeeplyNestedBreadcrumb: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Admin', 'admin', [
									createMockActivatedRoute('Settings', 'settings', [
										createMockActivatedRoute('System', 'system', [
											createMockActivatedRoute('Security', 'security', []),
										]),
									]),
								]),
							]),
						]),
					},
				},
			],
			template: `
				<header class="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black/95">
					<app-header />
				</header>
			`,
		};
	},
};

/**
 * Header with various breadcrumb title lengths.
 */
export const VariableTitleLengths: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Admin Dashboard & Configuration Center', 'dashboard', [
								createMockActivatedRoute('Settings', 'settings', []),
							]),
						]),
					},
				},
			],
			template: `
				<header class="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-black/95">
					<app-header />
				</header>
			`,
		};
	},
};

/**
 * Header showing responsive layout with full dashboard context.
 */
export const ResponsiveDashboardLayout: Story = {
	render: () => {
		const eventsSubject = new Subject<any>();

		return {
			providers: [
				{
					provide: Router,
					useValue: {
						events: eventsSubject.asObservable(),
						navigateByUrl: () => {},
					},
				},
				{
					provide: 'ActivatedRoute',
					useValue: {
						root: createMockActivatedRoute(undefined, '', [
							createMockActivatedRoute('Dashboard', 'dashboard', [
								createMockActivatedRoute('Analytics', 'analytics', []),
							]),
						]),
					},
				},
			],
			template: `
				<div class="space-y-4">
					<div>
						<p class="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Desktop (1920px)</p>
						<div style="max-width: 100%;" class="border border-gray-200 dark:border-gray-800">
							<header class="border-b border-gray-200 p-4 dark:border-gray-800 dark:bg-black/95">
								<app-header />
							</header>
						</div>
					</div>
					<div>
						<p class="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Tablet (768px)</p>
						<div style="max-width: 768px;" class="border border-gray-200 dark:border-gray-800">
							<header class="border-b border-gray-200 p-3 dark:border-gray-800 dark:bg-black/95">
								<app-header />
							</header>
						</div>
					</div>
					<div>
						<p class="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">Mobile (375px)</p>
						<div style="max-width: 375px;" class="border border-gray-200 dark:border-gray-800">
							<header class="border-b border-gray-200 p-2 dark:border-gray-800 dark:bg-black/95">
								<app-header />
							</header>
						</div>
					</div>
				</div>
			`,
		};
	},
};
