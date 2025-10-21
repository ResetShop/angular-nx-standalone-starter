import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { Component } from '@angular/core';
import { featherHome, featherActivity, featherRefreshCw } from '@ng-icons/feather-icons';
import { Sidebar } from './sidebar';
import { Navigation } from '@providers/navigation/navigation';

@Component({
	selector: 'app-dummy',
	standalone: true,
	template: '<div>Dummy Component</div>',
})
class DummyComponent {}

const meta: Meta<Sidebar> = {
	component: Sidebar,
	title: 'Navigation/Sidebar',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [
				provideRouter([{ path: '**', component: DummyComponent }]),
				provideIcons({ featherHome, featherActivity, featherRefreshCw }),
				Navigation,
			],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A complete sidebar navigation component for application layouts.

## Features

- **Full-Height Layout**: Uses CSS Grid to structure header, navigation, and footer
- **Dynamic Navigation**: Pulls navigation data from the Navigation service
- **Icon Support**: Integrates with ng-icons for consistent iconography
- **RouterLink Integration**: Seamless navigation with Angular Router
- **Branding Area**: Top section for logo or app name
- **Sign Out Section**: Bottom section for authentication actions
- **Responsive**: Adapts to different screen sizes
- **OnPush Change Detection**: Optimized performance

## Layout Structure

The sidebar is divided into three main sections:
1. **Header (64px)**: Branding and home link
2. **Navigation (1fr)**: Scrollable navigation sections
3. **Footer (64px)**: User actions like sign out

## Usage

\`\`\`typescript
import { Sidebar } from '@components/sidebar';

@Component({
  imports: [Sidebar],
  template: \`
    <div class="flex h-screen">
    	<aside>
    		<app-sidebar />
    	</aside>
    	<main class="flex-1">
    	<!-- Your content here -->
    	</main>
    </div>
  \`
})
\`\`\`

## Navigation Service

The sidebar uses the Navigation injectable service to manage navigation sections.
You can inject this service to dynamically update the navigation structure.

\`\`\`typescript
import { Navigation } from '@providers/navigation';

@Component({...})
export class MyComponent {
  navigation = inject(Navigation);

  // Access sections
  sections = this.navigation.sections();
}
\`\`\`

## Interactive Demo

The sidebar below shows the full component in action with navigation sections from the Navigation service.
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
		layout: 'fullscreen',
	},
};

export default meta;

type Story = StoryObj<Sidebar>;

/**
 * Default sidebar with all navigation sections from the Navigation service.
 * Shows the complete layout with header, navigation, and footer.
 */
export const Default: Story = {
	render: () => ({
		template: `
			<div class="flex h-screen bg-gray-50">
				<div class="w-64 border-r border-gray-200 bg-white">
					<app-sidebar />
				</div>
				<main class="flex-1 p-8">
					<h1 class="text-2xl font-bold text-gray-900 mb-4">Main Content Area</h1>
					<p class="text-gray-600">This is where your page content would appear. The sidebar navigation is on the left.</p>
				</main>
			</div>
		`,
	}),
};

/**
 * Sidebar in a narrow container to demonstrate responsive behavior.
 */
export const Narrow: Story = {
	render: () => ({
		template: `
			<div class="flex h-screen bg-gray-50">
				<div class="w-56 border-r border-gray-200 bg-white">
					<app-sidebar />
				</div>
				<main class="flex-1 p-8">
					<h1 class="text-2xl font-bold text-gray-900 mb-4">Narrow Sidebar</h1>
					<p class="text-gray-600">Sidebar width reduced to 224px (w-56)</p>
				</main>
			</div>
		`,
	}),
};

/**
 * Sidebar in a dark theme layout.
 */
export const DarkTheme: Story = {
	render: () => ({
		template: `
			<div class="flex h-screen bg-gray-900">
				<div class="w-64 border-r border-gray-700 bg-gray-800 dark">
					<app-sidebar />
				</div>
				<main class="flex-1 p-8 bg-gray-900">
					<h1 class="text-2xl font-bold text-gray-100 mb-4">Dark Theme Layout</h1>
					<p class="text-gray-400">The sidebar adapts to dark mode when wrapped in a dark theme.</p>
				</main>
			</div>
		`,
	}),
};

/**
 * Sidebar only, without the main content area.
 * Useful for inspecting the component in isolation.
 */
export const SidebarOnly: Story = {
	render: () => ({
		template: `
			<div class="w-64 h-screen border border-gray-200 bg-white">
				<app-sidebar />
			</div>
		`,
	}),
};

/**
 * Sidebar with custom width to show flexibility.
 */
export const CustomWidth: Story = {
	render: () => ({
		template: `
			<div class="flex h-screen bg-gray-50">
				<div class="w-72 border-r border-gray-200 bg-white">
					<app-sidebar />
				</div>
				<main class="flex-1 p-8">
					<h1 class="text-2xl font-bold text-gray-900 mb-4">Wide Sidebar</h1>
					<p class="text-gray-600">Sidebar width increased to 288px (w-72)</p>
				</main>
			</div>
		`,
	}),
};

/**
 * Mobile-like view showing how the sidebar appears in a smaller viewport.
 */
export const MobileView: Story = {
	render: () => ({
		template: `
			<div class="w-full max-w-md mx-auto h-screen bg-gray-50">
				<app-sidebar />
			</div>
		`,
	}),
	parameters: {
		viewport: {
			defaultViewport: 'mobile1',
		},
	},
};
