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
- **Dark Mode**: Full dark mode support

## Usage

\`\`\`typescript
import NavItem from '@components/nav-item';

// Simple nav item
<li [item]="{ id: '1', name: 'Home', route: '/home' }" appNavItem></li>

// Nav item with children
<li [item]="{
  id: '2',
  name: 'Settings',
  route: '/settings',
  children: [
    { id: '2a', name: 'Profile', route: '/settings/profile' },
    { id: '2b', name: 'Security', route: '/settings/security' }
  ]
}" appNavItem></li>
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

type Story = StoryObj<typeof NavItem>;

/**
 * Default navigation item with icon and text.
 * Most common use case for navigation menus.
 */
export const Default: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2">
				<li [item]="{
					id: 'home',
					name: 'Home',
					route: '/home',
					icon: { featherHome },
					children: []
				}" appNavItem></li>
			</ul>
		`,
	}),
};

/**
 * Navigation item without an icon.
 * Use when icons are not needed or unavailable.
 */
export const WithoutIcon: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2">
				<li [item]="{
					id: 'settings',
					name: 'Settings',
					route: '/settings',
					children: []
				}" appNavItem></li>
			</ul>
		`,
	}),
};

/**
 * Multiple navigation items showing a typical menu structure.
 */
export const MultipleItems: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2 space-y-1">
				<li [item]="{
					id: 'home',
					name: 'Home',
					route: '/home',
					icon: { featherHome },
					children: []
				}" appNavItem></li>
				<li [item]="{
					id: 'activity',
					name: 'Activity',
					route: '/activity',
					icon: { featherActivity },
					children: []
				}" appNavItem></li>
				<li [item]="{
					id: 'settings',
					name: 'Settings',
					route: '/settings',
					icon: { featherSettings },
					children: []
				}" appNavItem></li>
				<li [item]="{
					id: 'profile',
					name: 'Profile',
					route: '/profile',
					icon: { featherUser },
					children: []
				}" appNavItem></li>
			</ul>
		`,
	}),
};

/**
 * Navigation items with different icon types.
 */
export const DifferentIcons: Story = {
	render: () => ({
		template: `
			<div class="flex gap-4">
				<ul class="w-64 rounded-lg border border-gray-200 p-2 space-y-1">
					<li [item]="{
						id: 'home',
						name: 'Home',
						route: '/home',
						icon: { featherHome },
						children: []
					}" appNavItem></li>
					<li [item]="{
						id: 'help',
						name: 'Help',
						route: '/help',
						icon: { featherHelpCircle },
						children: []
					}" appNavItem></li>
				</ul>
			</div>
		`,
	}),
};

/**
 * Long text navigation item to demonstrate text wrapping behavior.
 */
export const LongText: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2">
				<li [item]="{
					id: 'long',
					name: 'This is a very long navigation item name that should be truncated',
					route: '/long-route',
					icon: { featherSettings }
				}" appNavItem></li>
			</ul>
		`,
	}),
};

/**
 * Parent item with expandable children.
 * Click the parent to expand/collapse the child routes.
 */
export const WithChildren: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2">
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
 * Multiple items with mix of parents and leaf nodes.
 */
export const MixedNavigation: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2 space-y-1">
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
 * Dark mode variant showing all navigation states.
 */
export const DarkMode: Story = {
	render: () => ({
		template: `
			<div class="dark bg-gray-900 p-4">
				<ul class="w-64 rounded-lg border border-gray-700 p-2 space-y-1 bg-gray-800">
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
							{ id: 'security', name: 'Security', route: '/settings/security' }
						]
					}" appNavItem></li>
				</ul>
			</div>
		`,
	}),
};

/**
 * Deeply nested navigation (3 levels).
 * Note: Recommend keeping nesting to 2-3 levels max.
 */
export const DeepNesting: Story = {
	render: () => ({
		template: `
			<ul class="w-64 rounded-lg border border-gray-200 p-2">
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
		`,
	}),
};
