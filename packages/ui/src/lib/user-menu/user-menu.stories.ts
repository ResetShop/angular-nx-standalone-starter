import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherBell, featherLogOut, featherSettings, featherUser } from '@ng-icons/feather-icons'
import type { Meta, StoryObj } from '@storybook/angular'
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular'
import { type RowAction } from '../row-actions-menu/row-action-item'
import { UserMenu } from './user-menu'

const noop = () => undefined

const accountActions: RowAction[] = [
	{ label: 'Account', icon: 'featherUser', onSelect: noop },
	{ label: 'Settings', icon: 'featherSettings', onSelect: noop },
	{ label: 'Notifications', icon: 'featherBell', onSelect: noop },
]
const sessionActions: RowAction[] = [{ label: 'Log out', icon: 'featherLogOut', onSelect: noop }]

// Plain DOM (not `@testing-library/*`) because Storybook's lint rule forbids those imports in story files.
function openMenu(canvasElement: HTMLElement): void {
	canvasElement.querySelector<HTMLButtonElement>('button')?.click()
}

// Pins the tile to the bottom of a sidebar-shaped column, with room beside and above it for the
// menu, which opens to the right and grows upwards from the trigger's bottom edge.
function sidebarFooter(width: string) {
	return componentWrapperDecorator(
		(story) => `
			<div class="flex h-96 items-end">
				<div class="border-border bg-background ${width} border-t border-r p-2">${story}</div>
			</div>
		`,
	)
}

const meta: Meta<UserMenu> = {
	component: UserMenu,
	title: 'Components/UserMenu',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [NgIcon],
			providers: [provideIcons({ featherUser, featherSettings, featherBell, featherLogOut })],
		}),
	],
	args: {
		name: 'Ada Lovelace',
		email: 'ada@example.com',
		initials: 'AL',
		actions: [accountActions, sessionActions],
		collapsed: false,
		placement: 'right-end',
	},
	argTypes: {
		name: {
			control: 'text',
			description: 'The signed-in user’s full name. Also the trigger’s accessible name, in both states.',
			table: { type: { summary: 'string' } },
		},
		email: {
			control: 'text',
			description: 'The signed-in user’s email.',
			table: { type: { summary: 'string' } },
		},
		initials: {
			control: 'text',
			description: 'Shown in the avatar. The caller derives them from the name.',
			table: { type: { summary: 'string' } },
		},
		actions: {
			control: 'object',
			description:
				'Same shape as `RowActionsMenu`: a flat `RowAction[]`, or `RowAction[][]` groups with a separator between each pair. Empty groups are dropped.',
			table: { type: { summary: 'RowAction[] | RowAction[][]' } },
		},
		collapsed: {
			control: 'boolean',
			description: 'Avatar-only trigger, for a sidebar collapsed to icons. The menu is unchanged.',
			table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
		},
		placement: {
			control: 'select',
			options: ['right-end', 'right-start', 'top', 'top-start', 'top-end', 'bottom-start'],
			description: 'Where the menu opens relative to the trigger. It still flips when there is no room.',
			table: { type: { summary: 'NgpMenuPlacement' }, defaultValue: { summary: "'right-end'" } },
		},
	},
	parameters: {
		docs: {
			description: {
				component: `
A tile identifying the signed-in user, pinned to the bottom of a sidebar, that opens a menu of
user-scoped actions.

## Behavior

- **Expanded:** avatar, name, email and a ⋮ affordance. **Collapsed:** avatar only.
- The menu always starts with a non-interactive header repeating the avatar, name and email —
  when the sidebar is collapsed it is the only place the user's identity is visible.
- The trigger's accessible name is the user's name in both states.
- Built on \`ng-primitives\` \`NgpMenu\`: arrow keys move between items, Enter/Space activates,
  Escape closes and returns focus to the trigger; clicking outside closes it.
- Opens to the right of the trigger by default (\`placement\`), flipping when there is no room.
- Items are \`RowActionItem\`s, so icons, disabled and destructive items behave exactly as in
  \`RowActionsMenu\`. Labels arrive already translated.
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta
type Story = StoryObj<UserMenu>

export const Expanded: Story = {
	decorators: [sidebarFooter('w-64')],
}

/** Expanded, with the menu open. */
export const ExpandedOpen: Story = {
	decorators: [sidebarFooter('w-64')],
	play: ({ canvasElement }) => openMenu(canvasElement),
}

export const Collapsed: Story = {
	args: { collapsed: true },
	decorators: [sidebarFooter('w-16')],
}

/** Collapsed, with the menu open: the header is the only place the user's name and email show. */
export const CollapsedOpen: Story = {
	args: { collapsed: true },
	decorators: [sidebarFooter('w-16')],
	play: ({ canvasElement }) => openMenu(canvasElement),
}

/** Long names and emails truncate in the trigger and in the menu header instead of wrapping. */
export const LongNameAndEmail: Story = {
	args: {
		name: 'Augusta Ada King, Countess of Lovelace',
		email: 'augusta.ada.king.countess.of.lovelace@analytical-engine.example.com',
	},
	decorators: [sidebarFooter('w-64')],
	play: ({ canvasElement }) => openMenu(canvasElement),
}

/** Opening upwards, for a trigger at the bottom of a narrow mobile drawer. */
export const OpensUpwards: Story = {
	args: { placement: 'top' },
	decorators: [sidebarFooter('w-64')],
	play: ({ canvasElement }) => openMenu(canvasElement),
}
