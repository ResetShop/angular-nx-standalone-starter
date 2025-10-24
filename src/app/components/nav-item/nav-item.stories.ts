import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { featherHome, featherActivity, featherSettings, featherUser, featherHelpCircle } from '@ng-icons/feather-icons';
import NavItem from './nav-item';

const meta: Meta<typeof NavItem> = {
	component: NavItem,
	title: 'Navigation/NavItem',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [
				provideRouter([{ path: '**', component: NavItem }]),
				provideIcons({ featherHome, featherActivity, featherSettings, featherUser, featherHelpCircle }),
			],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A navigation item component that displays a clickable link with an optional icon and label.

## Features

- **RouterLink Integration**: Uses Angular Router for navigation
- **Optional Icon**: Displays an icon from ng-icons if provided
- **Responsive**: Adapts to different screen sizes
- **Hover Effects**: Visual feedback on hover
- **Accessibility**: Semantic HTML with proper link elements

## Usage

\`\`\`typescript
import NavItem from '@components/nav-item';

@Component({
  imports: [NavItem],
  template: \`
    <li [item]="navRoute" appNavItem></li>
  \`
})
\`\`\`

## Interactive Demo

Try the examples below to see different navigation item configurations.
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
					name: 'This is a very long navigation item name that might wrap',
					route: '/long-route',
					icon: { featherSettings },
					children: []
				}" appNavItem></li>
			</ul>
		`,
	}),
};
