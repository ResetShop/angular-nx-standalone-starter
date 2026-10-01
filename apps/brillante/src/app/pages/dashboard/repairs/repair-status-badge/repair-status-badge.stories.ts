import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { RepairStatusBadge } from './repair-status-badge'

const meta: Meta<RepairStatusBadge> = {
	component: RepairStatusBadge,
	title: 'Pages/Dashboard/Repairs/RepairStatusBadge',
	tags: ['autodocs'],
	decorators: [moduleMetadata({ imports: [RepairStatusBadge] })],
	parameters: {
		docs: {
			description: {
				component:
					'Status pill of a repair. Finished statuses use the default variant, statuses that need attention ' +
					'(re-entered, waiting on the customer) the destructive one, and the rest the secondary one.',
			},
			canvas: { sourceState: 'shown' },
		},
	},
}

export default meta
type Story = StoryObj<RepairStatusBadge>

const render: Story['render'] = (args) => ({
	props: args,
	template: `<app-repair-status-badge [status]="status" />`,
})

/** A repair in progress renders as secondary. */
export const InProgress: Story = {
	args: { status: { id: RepairStatusId.IN_PROGRESS, description: 'En progreso' } },
	render,
}

/** A finished repair renders with the default variant. */
export const Finished: Story = {
	args: { status: { id: RepairStatusId.FINISHED_AND_PAID, description: 'Finalizada y abonada' } },
	render,
}

/** A repair that came back renders with the destructive variant. */
export const Reentered: Story = {
	args: { status: { id: RepairStatusId.REENTERED, description: 'Reingresado' } },
	render,
}
