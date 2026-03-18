import { Component, inject, input } from '@angular/core'
import { Button } from '@components/button/button'
import type { NotificationType } from '@store/ui/ui.types'
import { DEFAULT_NOTIFICATION_DURATION } from '@store/ui/ui.types'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import { parseDurationToMs } from '@utils/duration'
import type { NgpToastOptions } from 'ng-primitives/toast'
import { NgpToastManager, provideToastConfig } from 'ng-primitives/toast'
import { ToastNotification } from './toast-notification'

type ToastPlacement = NonNullable<NgpToastOptions['placement']>

/**
 * Wrapper component that triggers toast notifications via NgpToastManager directly,
 * allowing per-toast placement control from Storybook args.
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
	public readonly placement = input<ToastPlacement>('bottom-center')

	private readonly toastManager = inject(NgpToastManager)

	protected show(type: NotificationType, message: string): void {
		const id = crypto.randomUUID()
		const notification = { id, type, message }

		this.toastManager.show(ToastNotification, {
			context: notification,
			placement: this.placement(),
			duration: parseDurationToMs(DEFAULT_NOTIFICATION_DURATION),
		})
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
					placement: 'bottom-center',
					duration: parseDurationToMs(DEFAULT_NOTIFICATION_DURATION),
					dismissible: true,
					maxToasts: 3,
					gap: 16,
					zIndex: 9999,
				}),
			],
		}),
	],
	argTypes: {
		placement: {
			control: 'select',
			options: ['top-start', 'top-center', 'top-end', 'bottom-start', 'bottom-center', 'bottom-center'],
			description: 'Position where toasts appear on the screen',
			table: {
				type: { summary: 'NgpToastPlacement' },
				defaultValue: { summary: "'bottom-center'" },
			},
		},
	},
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
Toast notifications powered by ng-primitives (\`NgpToast\`) with Sonner-style shadcn design.

## Features
- Four notification types: \`success\`, \`error\`, \`warning\`, \`info\`
- Configurable placement: top/bottom + start/center/end
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

/** Click the buttons to trigger toast notifications. Use the placement control to change position. */
export const AllVariants: Story = {
	args: { placement: 'bottom-center' },
	render: (args) => ({ props: args }),
}
