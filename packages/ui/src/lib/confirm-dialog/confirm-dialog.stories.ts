import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { Button } from '../button/button'
import { ConfirmDialog } from './confirm-dialog'

const meta: Meta<ConfirmDialog> = {
	component: ConfirmDialog,
	title: 'Components/ConfirmDialog',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [ConfirmDialog, Button],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A confirmation dialog component using the native \`<dialog>\` element with \`showModal()\`.

## Features

- **Native Dialog**: Uses \`<dialog>\` with \`showModal()\` for proper modal behavior
- **Imperative API**: Open/close via template ref — \`dialog.show()\` / \`dialog.close()\`
- **Alert Dialog Role**: Uses \`role="alertdialog"\` for semantic correctness
- **Configurable**: Custom title, message, button text, and confirm variant
- **Destructive Actions**: Supports destructive confirm variant for delete operations
- **Accessible**: aria-labelledby, aria-describedby, focus management
- **Keyboard Support**: Press ESC to cancel and close the dialog
- **Animated**: Fade + scale animation with reduced-motion support

## Usage

\`\`\`html
<button (click)="dialog.show()">Delete</button>

<app-confirm-dialog #dialog
  title="Delete Item"
  message="This action cannot be undone."
  confirmText="Delete"
  confirmVariant="destructive"
  (confirmed)="onDelete()"
  (cancelled)="onCancel()"
/>
\`\`\`
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
	argTypes: {
		title: {
			control: 'text',
			description: 'Dialog title',
			table: { defaultValue: { summary: 'Confirm' } },
		},
		message: {
			control: 'text',
			description: 'Dialog message body',
		},
		confirmText: {
			control: 'text',
			description: 'Text for the confirm button',
			table: { defaultValue: { summary: 'Confirm' } },
		},
		cancelText: {
			control: 'text',
			description: 'Text for the cancel button',
			table: { defaultValue: { summary: 'Cancel' } },
		},
		confirmVariant: {
			control: 'select',
			options: ['default', 'destructive'],
			description: 'Visual variant for the confirm button',
			table: { defaultValue: { summary: 'default' } },
		},
	},
}

export default meta

type Story = StoryObj<ConfirmDialog>

/**
 * Default confirm dialog with configurable options.
 */
export const Default: Story = {
	args: {
		title: 'Confirm Action',
		message: 'Are you sure you want to proceed with this action?',
		confirmText: 'Confirm',
		cancelText: 'Cancel',
		confirmVariant: 'default',
	},
	render: (args) => ({
		props: args,
		template: `
			<button appButton (click)="dialog.show()">Open Dialog</button>

			<app-confirm-dialog #dialog
				[title]="title"
				[message]="message"
				[confirmText]="confirmText"
				[cancelText]="cancelText"
				[confirmVariant]="confirmVariant"
			/>
		`,
	}),
}

/**
 * Destructive confirmation for dangerous actions like deletion.
 */
export const Destructive: Story = {
	render: () => ({
		template: `
			<button appButton variant="destructive" (click)="dialog.show()">Delete Item</button>

			<app-confirm-dialog #dialog
				title="Delete Item"
				message="This action cannot be undone. This will permanently delete the item."
				confirmText="Delete"
				confirmVariant="destructive"
			/>
		`,
	}),
}

/**
 * Dialog with custom button labels.
 */
export const CustomButtonText: Story = {
	render: () => ({
		template: `
			<button appButton (click)="dialog.show()">Discard Changes</button>

			<app-confirm-dialog #dialog
				title="Unsaved Changes"
				message="You have unsaved changes. Do you want to discard them?"
				confirmText="Discard"
				cancelText="Keep Editing"
			/>
		`,
	}),
}

/**
 * Minimal dialog with title only.
 */
export const MinimalDialog: Story = {
	render: () => ({
		template: `
			<button appButton (click)="dialog.show()">Quick Confirm</button>

			<app-confirm-dialog #dialog title="Are you sure?" />
		`,
	}),
}
