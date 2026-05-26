import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherEdit3, featherKey, featherTrash2 } from '@ng-icons/feather-icons'
import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { within } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { RowActionsMenu, type RowAction } from './row-actions-menu'

const noop = (label: string) => () => console.log(`[RowActionsMenu] selected: ${label}`)

const meta: Meta<RowActionsMenu> = {
	component: RowActionsMenu,
	title: 'Components/RowActionsMenu',
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
A vertical-ellipsis (⋮) trigger that opens a popover menu with row-scoped actions.

Designed to replace inline action buttons in data-table rows: one icon-only trigger keeps
the row visually quiet at rest, the menu reveals the full action set on demand.

## Inputs

- \`actions\` (required) — array of \`RowAction\` items. Each item is rendered as a menu
  button. Destructive items get \`text-destructive\` via \`variant: 'destructive'\`.
- \`triggerLabel\` — accessible name for the trigger button (announced by screen readers).
  Defaults to \`'Actions'\`. Apps pass a translation: \`[triggerLabel]="'ROW_ACTIONS.TRIGGER_LABEL' | translate"\`.

## Behavior

- Renders nothing when \`actions\` is empty (consumers do not need to guard).
- Built on \`ng-primitives\` \`NgpMenu\` — standard ARIA menu keyboard handling: arrow keys
  navigate, Enter/Space activates, Escape closes, focus returns to the trigger on keyboard close.
- Menu opens \`bottom-start\` relative to the trigger and flips near viewport edges.
- Clicking a menu item invokes its \`onSelect\` callback and closes the menu.
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta

type Story = StoryObj<RowActionsMenu>

const sampleActions: RowAction[] = [
	{ label: 'Edit', onSelect: noop('Edit') },
	{ label: 'Reset password', onSelect: noop('Reset password') },
	{ label: 'Delete', onSelect: noop('Delete'), variant: 'destructive' },
]

/**
 * The default menu with three actions including a destructive Delete item. Click the ⋮ trigger to open.
 */
export const Default: Story = {
	args: {
		actions: sampleActions,
	},
}

/**
 * The same three actions, but the play function auto-opens the menu so the static canvas
 * shows the popover contents for visual review without requiring interaction.
 */
export const Open: Story = {
	args: {
		actions: sampleActions,
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
	},
}

/**
 * Each action carries an `icon` field, rendered before the label inside the menu item.
 */
export const WithIcons: Story = {
	args: {
		actions: [
			{ label: 'Edit', onSelect: noop('Edit'), icon: 'featherEdit3' },
			{ label: 'Reset password', onSelect: noop('Reset password'), icon: 'featherKey' },
			{ label: 'Delete', onSelect: noop('Delete'), variant: 'destructive', icon: 'featherTrash2' },
		],
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement)
		await userEvent.click(canvas.getByRole('button', { name: 'Actions' }))
	},
}

/**
 * A single-action menu renders as a menu (not collapsed to a bare button). Consistent UX
 * with multi-action cases — predictable affordance regardless of action count.
 */
export const SingleAction: Story = {
	args: {
		actions: [{ label: 'Edit', onSelect: noop('Edit') }],
	},
}

/**
 * Edge case: when `actions` is empty the component renders nothing at all. The actions cell
 * remains empty so callers do not need to guard their `<app-row-actions-menu>` invocations
 * with their own `@if`.
 */
export const EmptyActions: Story = {
	args: {
		actions: [],
	},
}
