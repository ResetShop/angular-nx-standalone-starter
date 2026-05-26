import type { Meta, StoryObj } from '@storybook/angular'
import { RowActionsMenu } from './row-actions-menu'

// TODO: Add an `argTypes` block once the component declares public `input()` properties.
const meta: Meta<RowActionsMenu> = {
	component: RowActionsMenu,
	title: 'Components/RowActionsMenu',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: 'TODO: Add component description',
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta

type Story = StoryObj<RowActionsMenu>

export const Default: Story = {
	render: () => ({
		template: `<app-row-actions-menu></app-row-actions-menu>`,
	}),
}
