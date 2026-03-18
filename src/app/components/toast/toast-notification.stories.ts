import { Component, inject } from '@angular/core'
import { Button } from '@components/button/button'
import { UIStore } from '@store/ui/ui.store'
import type { NotificationType } from '@store/ui/ui.types'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import { provideToastConfig } from 'ng-primitives/toast'
import { ToastBridgeService } from './toast-bridge.service'

/**
 * Wrapper component that triggers toast notifications via UIStore.
 * The ToastNotification component itself cannot be rendered standalone
 * because it depends on the ng-primitives toast portal context.
 */
@Component({
	selector: 'app-toast-story',
	imports: [Button],
	template: `
		<div class="flex flex-wrap gap-2 p-6">
			<button (click)="show('success', 'Changes saved successfully.')" appButton variant="default">
				Success Toast
			</button>
			<button (click)="show('error', 'Failed to save changes.')" appButton variant="default">Error Toast</button>
			<button (click)="show('warning', 'Your session will expire in 5 minutes.')" appButton variant="default">
				Warning Toast
			</button>
			<button (click)="show('info', 'A new version is available.')" appButton variant="default">Info Toast</button>
		</div>
	`,
})
class ToastStory {
	private readonly uiStore = inject(UIStore)
	// Activate the bridge so UIStore notifications render as ng-primitives toasts
	private readonly _bridge = inject(ToastBridgeService)

	protected show(type: NotificationType, message: string): void {
		this.uiStore.showNotification({ type, message })
	}
}

type Story = StoryObj<ToastStory>

const meta: Meta<ToastStory> = {
	component: ToastStory,
	title: 'Components/Toast Notification',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [
				...provideToastConfig({
					placement: 'bottom-end',
					duration: 5000,
					dismissible: true,
					maxToasts: 3,
					gap: 16,
					zIndex: 9999,
				}),
			],
		}),
	],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
Toast notifications powered by ng-primitives (\`NgpToast\`) with Sonner-style shadcn design.

## Features
- Four notification types: \`success\`, \`error\`, \`warning\`, \`info\`
- Auto-dismiss after 5 seconds (configurable per notification)
- Manual dismiss via X button
- Swipe-to-dismiss gesture support
- Stacking with max 3 visible toasts
- Bridged from \`UIStore.showNotification()\` to \`NgpToastManager\` via \`ToastBridgeService\`

## Usage
\`\`\`typescript
const uiStore = inject(UIStore);
uiStore.showNotification({ type: 'success', message: 'Saved!' });
\`\`\`
				`,
			},
			canvas: { sourceState: 'shown' },
		},
	},
}

export default meta

/** Click the buttons to trigger toast notifications of each type */
export const AllVariants: Story = {}
