import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherEdit3, featherKey, featherTrash2 } from '@ng-icons/feather-icons'
import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { RowActionItem } from './row-action-item'

const noop = (label: string) => () => console.log(`[RowActionItem] selected: ${label}`)

const meta: Meta<RowActionItem> = {
	component: RowActionItem,
	title: 'Components/RowActionItem',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [NgIcon],
			providers: [provideIcons({ featherEdit3, featherKey, featherTrash2 })],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A single menu-item button rendered inside a row-actions popover.

Owned by \`RowActionsMenu\` in production, but extracted so per-item rendering — icon
placement, color variant, disabled wiring — can be exercised independently.

Outside an \`ngpMenu\` host the button still renders correctly, but the menu-level
keyboard navigation provided by the parent menu is inert. These stories therefore
render the item in isolation for visual review only; interactive menu behavior is
demonstrated in \`Components/RowActionsMenu\`.

## Inputs

- \`action\` (required) — the \`RowAction\` to render. Includes \`label\`, \`onSelect\`,
  and the optional \`variant\`, \`icon\`, and \`disabled\` fields.
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta

type Story = StoryObj<RowActionItem>

export const Default: Story = {
	args: {
		action: { label: 'Edit', onSelect: noop('Edit') },
	},
}

export const WithIcon: Story = {
	args: {
		action: { label: 'Edit', onSelect: noop('Edit'), icon: 'featherEdit3' },
	},
}

export const Destructive: Story = {
	args: {
		action: { label: 'Delete', onSelect: noop('Delete'), variant: 'destructive', icon: 'featherTrash2' },
	},
}

export const Disabled: Story = {
	args: {
		action: { label: 'Reset password', onSelect: noop('Reset password'), icon: 'featherKey', disabled: true },
	},
}
