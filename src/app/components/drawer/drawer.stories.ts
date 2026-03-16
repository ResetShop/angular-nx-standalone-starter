import { Button } from '@components/button/button'
import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import type { DrawerDirection } from './drawer'
import { Drawer } from './drawer'
import { DrawerFooter } from './drawer-footer'

const meta: Meta<Drawer & { direction: DrawerDirection }> = {
	component: Drawer,
	title: 'Components/Drawer',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [Drawer, DrawerFooter, Button],
		}),
	],
	parameters: {
		docs: {
			description: {
				component: `
A slide-out drawer component using the native \`<dialog>\` element.

## Features

- **4 Directions**: Left, Right, Top, Bottom
- **Content-driven sizing**: Adjusts to fit its content
- **Native Dialog**: Uses \`<dialog>\` with \`showModal()\` for proper modal behavior
- **Accessibility**: \`aria-labelledby\` and \`aria-describedby\` linked to title/description
- **Backdrop**: Semi-transparent backdrop with optional click-outside handling
- **ESC Key Support**: Configurable ESC key close behavior
- **Header & Footer Slots**: Custom templates via directives
- **Smooth Animations**: CSS transitions for slide-in/out using \`data-open\` attribute
- **Imperative API**: Open/close via template ref — no parent state management needed

## Usage

\`\`\`html
<button (click)="drawer.show(); drawer.setContentReady()">Open</button>

<app-drawer #drawer title="Edit User" direction="right">
  <form>...</form>

  <ng-template appDrawerFooter>
    <button (click)="drawer.close()">Cancel</button>
    <button (click)="save()">Save</button>
  </ng-template>
</app-drawer>
\`\`\`
				`,
			},
		},
	},
	argTypes: {
		direction: {
			control: 'select',
			options: ['left', 'right', 'top', 'bottom'],
			description: 'Direction from which the drawer slides in',
			table: { type: { summary: 'DrawerDirection' }, defaultValue: { summary: 'right' } },
		},
		title: {
			control: 'text',
			description: 'Title displayed in the header',
		},
		description: {
			control: 'text',
			description: 'Description displayed below the title',
		},
		closeOnBackdrop: {
			control: 'boolean',
			description: 'Whether clicking the backdrop closes the drawer',
			table: { defaultValue: { summary: 'true' } },
		},
		closeOnEscape: {
			control: 'boolean',
			description: 'Whether pressing ESC closes the drawer',
			table: { defaultValue: { summary: 'true' } },
		},
	},
}

export default meta

type Story = StoryObj<Drawer & { direction: DrawerDirection }>

/**
 * Default drawer with configurable direction, title, and description.
 * Use the controls panel to change the direction.
 */
export const Default: Story = {
	args: {
		direction: 'right',
		title: 'Drawer Title',
		description: 'A brief description of the drawer content.',
	},
	render: (args) => ({
		props: args,
		template: `
			<button appButton (click)="drawer.show(); drawer.setContentReady()">Open Drawer</button>

			<app-drawer #drawer
				[direction]="direction"
				[title]="title"
				[description]="description"
			>
				<div class="space-y-4">
					<p class="text-gray-600 dark:text-gray-300">
						This is the drawer content. You can put forms, details, or any other content here.
					</p>
				</div>

				<ng-template appDrawerFooter>
					<div class="flex justify-end gap-3">
						<button appButton variant="secondary" (click)="drawer.close()">Cancel</button>
						<button appButton>Save</button>
					</div>
				</ng-template>
			</app-drawer>
		`,
	}),
}

/**
 * Drawer that cannot be closed by clicking the backdrop.
 * The user must use an explicit close action (e.g. a button).
 */
export const NoBackdropClose: Story = {
	args: {
		direction: 'right',
		title: 'Persistent Drawer',
		description: 'Click the backdrop — the drawer stays open.',
		closeOnBackdrop: false,
	},
	render: (args) => ({
		props: args,
		template: `
			<button appButton (click)="drawer.show(); drawer.setContentReady()">Open Drawer</button>

			<app-drawer #drawer
				[direction]="direction"
				[title]="title"
				[description]="description"
				[closeOnBackdrop]="closeOnBackdrop"
			>
				<p class="text-gray-600 dark:text-gray-300">
					Clicking outside this drawer will not close it.
				</p>

				<ng-template appDrawerFooter>
					<div class="flex justify-end">
						<button appButton (click)="drawer.close()">Close</button>
					</div>
				</ng-template>
			</app-drawer>
		`,
	}),
}

/**
 * Drawer that cannot be closed by pressing the ESC key.
 * The user must use an explicit close action.
 */
export const NoEscapeClose: Story = {
	args: {
		direction: 'right',
		title: 'No ESC Drawer',
		description: 'Press ESC — the drawer stays open.',
		closeOnEscape: false,
	},
	render: (args) => ({
		props: args,
		template: `
			<button appButton (click)="drawer.show(); drawer.setContentReady()">Open Drawer</button>

			<app-drawer #drawer
				[direction]="direction"
				[title]="title"
				[description]="description"
				[closeOnEscape]="closeOnEscape"
			>
				<p class="text-gray-600 dark:text-gray-300">
					Pressing ESC will not close this drawer.
				</p>

				<ng-template appDrawerFooter>
					<div class="flex justify-end">
						<button appButton (click)="drawer.close()">Close</button>
					</div>
				</ng-template>
			</app-drawer>
		`,
	}),
}

/**
 * Drawer with form content and footer actions.
 * Demonstrates a typical edit form use case.
 */
export const WithFormContent: Story = {
	args: {
		direction: 'right',
		title: 'Edit User',
		description: 'Update user information and roles',
	},
	render: (args) => ({
		props: args,
		template: `
			<button appButton (click)="drawer.show(); drawer.setContentReady()">Open Drawer</button>

			<app-drawer #drawer
				[direction]="direction"
				[title]="title"
				[description]="description"
			>
				<div class="space-y-4">
					<div>
						<label for="drawer-story-name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
						<input
							id="drawer-story-name"
							type="text"
							value="John Doe"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
						/>
					</div>
					<div>
						<label for="drawer-story-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
						<input
							id="drawer-story-email"
							type="email"
							value="john&#64;example.com"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800"
						/>
					</div>
				</div>

				<ng-template appDrawerFooter>
					<div class="flex justify-end gap-3">
						<button appButton variant="secondary" (click)="drawer.close()">Cancel</button>
						<button appButton>Save Changes</button>
					</div>
				</ng-template>
			</app-drawer>
		`,
	}),
}
