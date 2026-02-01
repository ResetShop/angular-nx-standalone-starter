import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
	featherActivity,
	featherCalendar,
	featherChevronRight,
	featherFileText,
	featherHelpCircle,
	featherHome,
	featherMail,
	featherSettings,
	featherUser,
} from '@ng-icons/feather-icons';
import { NavigationState } from '@providers/navigation/navigation-state';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import NavSection from './nav-section';

@Component({
	selector: 'app-dummy',
	standalone: true,
	template: '<div>Dummy Component</div>',
})
class DummyComponent {}

const meta: Meta<typeof NavSection> = {
	component: NavSection,
	title: 'Navigation/NavSection',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [
				provideRouter([{ path: '**', component: DummyComponent }]),
				provideIcons({
					featherHome,
					featherActivity,
					featherSettings,
					featherUser,
					featherHelpCircle,
					featherMail,
					featherCalendar,
					featherFileText,
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
A navigation section component that displays a group of related navigation items with an optional title.

## Features

- **Optional Title**: Show or hide the section title
- **Multiple Routes**: Display multiple navigation items
- **Grouped Navigation**: Organize related routes together
- **Consistent Styling**: Uniform appearance across all navigation items
- **Track by ID**: Efficient rendering with Angular's track function

## Usage

\`\`\`typescript
import NavSection from '@components/nav-section';

@Component({
  imports: [NavSection],
  template: \`
    <app-nav-section
      [section]="navigationSection"
      [showTitle]="true"
    />
  \`
})
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

type Story = StoryObj<typeof NavSection>;

/**
 * Default navigation section with title and multiple routes.
 *
 * **Variations:**
 * - Without title: Set `[showTitle]="false"`
 * - Without icons: Omit `icon` property from routes
 * - Dark mode: Toggle via Storybook toolbar (top-right)
 */
export const Default: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:bg-gray-800">
				<app-nav-section
					[showTitle]="true"
					[section]="{
						id: 'main',
						name: 'Main Navigation',
						routes: [
							{
								id: 'home',
								name: 'Home',
								route: '/home',
								icon: { featherHome }
							},
							{
								id: 'activity',
								name: 'Activity',
								route: '/activity',
								icon: { featherActivity }
							},
							{
								id: 'settings',
								name: 'Settings',
								route: '/settings',
								icon: { featherSettings }
							}
						]
					}"
				/>
			</div>
		`,
	}),
};

/**
 * Navigation section with expandable parent items.
 * Demonstrates hierarchical navigation with child routes.
 * Click parent items to expand/collapse their children.
 */
export const WithExpandableItems: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2 dark:border-gray-700 dark:bg-gray-800">
				<app-nav-section
					[section]="{
						id: 'main',
						name: 'Main Navigation',
						routes: [
							{
								id: 'home',
								name: 'Home',
								route: '/home',
								icon: { featherHome }
							},
							{
								id: 'users',
								name: 'Users',
								route: '/users',
								icon: { featherUser },
								children: [
									{ id: 'all-users', name: 'All Users', route: '/users/list' },
									{ id: 'create-user', name: 'Create User', route: '/users/create' },
									{ id: 'roles', name: 'User Roles', route: '/users/roles' }
								]
							},
							{
								id: 'settings',
								name: 'Settings',
								route: '/settings',
								icon: { featherSettings },
								children: [
									{ id: 'profile', name: 'Profile', route: '/settings/profile' },
									{ id: 'security', name: 'Security', route: '/settings/security' }
								]
							},
							{
								id: 'help',
								name: 'Help',
								route: '/help',
								icon: { featherHelpCircle }
							}
						]
					}"
				/>
			</div>
		`,
	}),
};

/**
 * Multiple navigation sections stacked vertically.
 * Demonstrates the typical sidebar pattern with grouped navigation.
 * Includes sections with many routes and mixed expandable/leaf items.
 */
export const MultipleSections: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2 flex flex-col gap-4 dark:border-gray-700 dark:bg-gray-800">
				<!-- Main Menu -->
				<app-nav-section
					[section]="{
						id: 'main',
						name: 'Main Menu',
						routes: [
							{
								id: 'home',
								name: 'Home',
								route: '/home',
								icon: { featherHome }
							},
							{
								id: 'activity',
								name: 'Activity',
								route: '/activity',
								icon: { featherActivity }
							},
							{
								id: 'messages',
								name: 'Messages',
								route: '/messages',
								icon: { featherMail }
							},
							{
								id: 'calendar',
								name: 'Calendar',
								route: '/calendar',
								icon: { featherCalendar }
							}
						]
					}"
				/>

				<!-- Management Section -->
				<app-nav-section
					[section]="{
						id: 'management',
						name: 'Management',
						routes: [
							{
								id: 'users',
								name: 'Users',
								route: '/users',
								icon: { featherUser },
								children: [
									{ id: 'all-users', name: 'All Users', route: '/users/list' },
									{ id: 'create-user', name: 'Create User', route: '/users/create' }
								]
							},
							{
								id: 'documents',
								name: 'Documents',
								route: '/documents',
								icon: { featherFileText }
							}
						]
					}"
				/>

				<!-- Settings & Help -->
				<app-nav-section
					[section]="{
						id: 'settings',
						name: 'Settings & Support',
						routes: [
							{
								id: 'preferences',
								name: 'Preferences',
								route: '/preferences',
								icon: { featherSettings },
								children: [
									{ id: 'profile', name: 'Profile', route: '/settings/profile' },
									{ id: 'security', name: 'Security', route: '/settings/security' }
								]
							},
							{
								id: 'help',
								name: 'Help Center',
								route: '/help',
								icon: { featherHelpCircle }
							}
						]
					}"
				/>

				<!-- Section without title -->
				<app-nav-section
					[showTitle]="false"
					[section]="{
						id: 'quick-actions',
						name: 'Quick Actions',
						routes: [
							{ id: 'action1', name: 'Dashboard', route: '/dashboard' },
							{ id: 'action2', name: 'Reports', route: '/reports' },
							{ id: 'action3', name: 'Analytics', route: '/analytics' }
						]
					}"
				/>
			</div>
		`,
	}),
};
