import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { Component } from '@angular/core';
import {
	featherHome,
	featherActivity,
	featherSettings,
	featherUser,
	featherHelpCircle,
	featherMail,
	featherCalendar,
	featherFileText,
} from '@ng-icons/feather-icons';
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
				}),
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

## Interactive Demo

Try the controls below to customize the navigation section. Toggle the title visibility and see how different sections look.
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
 */
export const Default: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2">
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
								icon: { featherHome },
								children: []
							},
							{
								id: 'activity',
								name: 'Activity',
								route: '/activity',
								icon: { featherActivity },
								children: []
							}
						]
					}"
				/>
			</div>
		`,
	}),
};

/**
 * Navigation section without title.
 * Useful when the section context is already clear.
 */
export const WithoutTitle: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2">
				<app-nav-section
					[showTitle]="false"
					[section]="{
						id: 'nav',
						name: 'Navigation',
						routes: [
							{
								id: 'home',
								name: 'Home',
								route: '/home',
								icon: { featherHome },
								children: []
							},
							{
								id: 'settings',
								name: 'Settings',
								route: '/settings',
								icon: { featherSettings },
								children: []
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
 * Common pattern in sidebars.
 */
export const MultipleSections: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2 space-y-4 flex flex-col gap-2">
				<app-nav-section
					[section]="{
						id: 'main',
						name: 'Main Menu',
						routes: [
							{
								id: 'home',
								name: 'Home',
								route: '/home',
								icon: { featherHome },
								children: []
							},
							{
								id: 'activity',
								name: 'Activity',
								route: '/activity',
								icon: { featherActivity },
								children: []
							}
						]
					}"
				/>
				<app-nav-section
					[section]="{
						id: 'settings',
						name: 'Settings',
						routes: [
							{
								id: 'profile',
								name: 'Profile',
								route: '/profile',
								icon: { featherUser },
								children: []
							},
							{
								id: 'preferences',
								name: 'Preferences',
								route: '/preferences',
								icon: { featherSettings },
								children: []
							}
						]
					}"
				/>
				<app-nav-section
					[section]="{
						id: 'help',
						name: 'Help & Support',
						routes: [
							{
								id: 'help',
								name: 'Help Center',
								route: '/help',
								icon: { featherHelpCircle },
								children: []
							}
						]
					}"
				/>
			</div>
		`,
	}),
};

/**
 * Section with many routes to demonstrate scrolling behavior.
 */
export const ManyRoutes: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2">
				<app-nav-section
					[section]="{
						id: 'full',
						name: 'All Features',
						routes: [
							{ id: '1', name: 'Home', route: '/home', icon: { featherHome }, children: [] },
							{ id: '2', name: 'Activity', route: '/activity', icon: { featherActivity }, children: [] },
							{ id: '3', name: 'Settings', route: '/settings', icon: { featherSettings }, children: [] },
							{ id: '4', name: 'Profile', route: '/profile', icon: { featherUser }, children: [] },
							{ id: '5', name: 'Help', route: '/help', icon: { featherHelpCircle }, children: [] },
							{ id: '6', name: 'Messages', route: '/messages', icon: { featherMail }, children: [] },
							{ id: '7', name: 'Calendar', route: '/calendar', icon: { featherCalendar }, children: [] },
							{ id: '8', name: 'Documents', route: '/documents', icon: { featherFileText }, children: [] }
						]
					}"
				/>
			</div>
		`,
	}),
};

/**
 * Section with routes that have no icons.
 */
export const WithoutIcons: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2">
				<app-nav-section
					[section]="{
						id: 'simple',
						name: 'Simple Menu',
						routes: [
							{ id: '1', name: 'Dashboard', route: '/dashboard', children: [] },
							{ id: '2', name: 'Reports', route: '/reports', children: [] },
							{ id: '3', name: 'Analytics', route: '/analytics', children: [] }
						]
					}"
				/>
			</div>
		`,
	}),
};

/**
 * Empty section with no routes.
 * Shows how the component handles edge cases.
 */
export const EmptySection: Story = {
	render: () => ({
		template: `
			<div class="w-64 rounded-lg border border-gray-200 p-2">
				<app-nav-section
					[section]="{
						id: 'empty',
						name: 'Empty Section',
						routes: []
					}"
				/>
			</div>
		`,
	}),
};
