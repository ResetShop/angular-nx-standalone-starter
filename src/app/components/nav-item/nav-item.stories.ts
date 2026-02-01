import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
	featherActivity,
	featherChevronRight,
	featherHelpCircle,
	featherHome,
	featherSettings,
	featherUser,
} from '@ng-icons/feather-icons';
import { NavigationState } from '@providers/navigation/navigation-state';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import NavItem from './nav-item';

const meta: Meta<typeof NavItem> = {
	component: NavItem,
	title: 'Navigation/NavItem',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [
				provideRouter([{ path: '**', component: NavItem }]),
				provideIcons({
					featherHome,
					featherActivity,
					featherSettings,
					featherUser,
					featherHelpCircle,
					featherChevronRight,
				}),
				NavigationState,
			],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A navigation item component that displays a clickable link with optional icon and label.
Supports hierarchical navigation with expandable/collapsible child routes.

## Features

- **RouterLink Integration**: Uses Angular Router for navigation
- **Optional Icon**: Displays an icon from ng-icons if provided
- **Hierarchical Navigation**: Supports nested child routes
- **Expandable/Collapsible**: Parent items can be expanded to show children
- **Auto-Expand**: Automatically expands when child route is active
- **Keyboard Navigation**: Full keyboard support (Enter/Space to toggle)
- **Accessibility**: ARIA attributes for screen readers
- **Active State**: Highlights active route with primary color
- **Dark Mode**: Full dark mode support (toggle in Storybook toolbar)

## Usage

\`\`\`typescript
import NavItem from '@components/nav-item';

// Simple nav item
<li [item]="{ id: '1', name: 'Home', route: '/home' }" appNavItem></li>

// Nav item with icon
<li [item]="{
  id: '2',
  name: 'Settings',
  route: '/settings',
  icon: { featherSettings }
}" appNavItem></li>

// Nav item with children
<li [item]="{
  id: '3',
  name: 'Users',
  route: '/users',
  children: [
    { id: '3a', name: 'All Users', route: '/users/list' },
    { id: '3b', name: 'Create User', route: '/users/create' }
  ]
}" appNavItem></li>
\`\`\`

**Note**: Toggle dark mode using Storybook's toolbar (top-right).
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
};

export default meta;

type Story = StoryObj<typeof NavItem>;

/**
 * Default navigation item with icon.
 * Most common use case for navigation menus.
 *
 * **Variations:**
 * - Without icon: Simply omit the `icon` property
 * - Different icons: Use any icon from `@ng-icons/feather-icons`
 * - Dark mode: Toggle via Storybook toolbar (top-right)
 */
export const Default: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:bg-gray-800">
				<li [item]="{
					id: 'home',
					name: 'Home',
					route: '/home',
					icon: { featherHome }
				}" appNavItem></li>
			</ul>
		`,
	}),
};

/**
 * Parent navigation item with expandable children.
 * Click the parent to expand/collapse child routes.
 * Demonstrates auto-expand when child route is active.
 */
export const WithChildren: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:bg-gray-800">
				<li [item]="{
					id: 'users',
					name: 'Users',
					route: '/users',
					icon: { featherUser },
					children: [
						{ id: 'users-list', name: 'All Users', route: '/users/list' },
						{ id: 'users-create', name: 'Create User', route: '/users/create' },
						{ id: 'users-roles', name: 'User Roles', route: '/users/roles' }
					]
				}" appNavItem></li>
			</ul>
		`,
	}),
};

/**
 * Realistic navigation menu showing multiple items.
 * Demonstrates a typical sidebar navigation pattern with mix of parent and leaf items.
 *
 * **Features shown:**
 * - Mix of items with and without icons
 * - Expandable parent items
 * - Leaf items (no children)
 * - Proper spacing between items
 */
export const Playground: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2 space-y-1 dark:border-gray-700 dark:bg-gray-800">
				<li [item]="{
					id: 'home',
					name: 'Home',
					route: '/home',
					icon: { featherHome }
				}" appNavItem></li>

				<li [item]="{
					id: 'settings',
					name: 'Settings',
					route: '/settings',
					icon: { featherSettings },
					children: [
						{ id: 'profile', name: 'Profile', route: '/settings/profile' },
						{ id: 'security', name: 'Security', route: '/settings/security' },
						{ id: 'notifications', name: 'Notifications', route: '/settings/notifications' }
					]
				}" appNavItem></li>

				<li [item]="{
					id: 'activity',
					name: 'Activity',
					route: '/activity',
					icon: { featherActivity }
				}" appNavItem></li>

				<li [item]="{
					id: 'help',
					name: 'Help',
					route: '/help',
					icon: { featherHelpCircle }
				}" appNavItem></li>
			</ul>
		`,
	}),
};

/**
 * Edge cases and special scenarios.
 * - **Long text**: Truncation with tooltip on hover
 * - **Deep nesting**: 3 levels (not recommended - max 2-3 levels)
 * - **Without icon**: Text-only navigation items
 */
export const EdgeCases: Story = {
	render: () => ({
		template: `
			<div class="space-y-8">
				<!-- Long text truncation -->
				<div>
					<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Long Text Truncation</h3>
					<ul class="w-64 rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:bg-gray-800">
						<li [item]="{
							id: 'long',
							name: 'This is a very long navigation item name that should be truncated with ellipsis',
							route: '/long-route',
							icon: { featherSettings }
						}" appNavItem></li>
					</ul>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Hover to see full text in tooltip</p>
				</div>

				<!-- Without icon -->
				<div>
					<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Without Icon</h3>
					<ul class="w-64 rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:bg-gray-800">
						<li [item]="{
							id: 'no-icon',
							name: 'Text Only',
							route: '/text-only'
						}" appNavItem></li>
					</ul>
				</div>

				<!-- Deep nesting (3 levels) -->
				<div>
					<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Deep Nesting</h3>
					<ul class="w-64 rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:bg-gray-800">
						<li [item]="{
							id: 'dashboard',
							name: 'Dashboard',
							route: '/dashboard',
							icon: { featherHome },
							children: [
								{
									id: 'analytics',
									name: 'Analytics',
									route: '/dashboard/analytics',
									children: [
										{ id: 'reports', name: 'Reports', route: '/dashboard/analytics/reports' },
										{ id: 'charts', name: 'Charts', route: '/dashboard/analytics/charts' }
									]
								},
								{ id: 'overview', name: 'Overview', route: '/dashboard/overview' }
							]
						}" appNavItem></li>
					</ul>
					<p class="text-xs text-gray-500 dark:text-gray-400 mt-2">⚠️ Recommend max 2-3 levels of nesting</p>
				</div>
			</div>
		`,
	}),
};
