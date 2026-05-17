import { signal } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { featherRefreshCw } from '@ng-icons/feather-icons'
import { UIStore } from '@store/ui/ui.store'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import { Brand } from './brand'

/**
 * Mock UIStore for Storybook. Brand reads `isSidebarEffectivelyCollapsed()` from the
 * UIStore to decide whether to render the brand text alongside the icon.
 */
function createMockUIStore(collapsed: boolean) {
	return {
		provide: UIStore,
		useValue: {
			isSidebarEffectivelyCollapsed: signal(collapsed).asReadonly(),
			toggleSidebar: () => {
				/* no-op for stories */
			},
		},
	}
}

const meta: Meta<Brand> = {
	component: Brand,
	title: 'Components/Brand',
	tags: ['autodocs'],
	parameters: {
		docs: {
			canvas: { sourceState: 'shown' },
			description: {
				component: `
The Brand component renders the application's brand link in the sidebar header. It is a router link
that navigates to the dashboard, with an icon and an optional brand label.

The label is hidden when the sidebar is effectively collapsed (read from \`UIStore.isSidebarEffectivelyCollapsed()\`).
				`,
			},
		},
	},
}

export default meta

type Story = StoryObj<Brand>

export const Expanded: Story = {
	decorators: [
		applicationConfig({
			providers: [provideRouter([]), provideIcons({ featherRefreshCw }), createMockUIStore(false)],
		}),
	],
}

export const Collapsed: Story = {
	decorators: [
		applicationConfig({
			providers: [provideRouter([]), provideIcons({ featherRefreshCw }), createMockUIStore(true)],
		}),
	],
}
