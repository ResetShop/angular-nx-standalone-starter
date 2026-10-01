import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import type { RepairStatus } from '@domain/repair/repair.model'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import { RepairStatusBadge } from './repair-status-badge'

describe('RepairStatusBadge', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	async function showBadge(status: RepairStatus) {
		await render(RepairStatusBadge, { inputs: { status } })
	}

	it('renders the description of the status', async () => {
		const status = { id: RepairStatusId.IN_PROGRESS, description: 'En progreso' }
		await showBadge(status)
		const badge = screen.getByText(status.description)

		expect(badge).toBeInTheDocument()
	})

	it('uses the default variant for a finished status', async () => {
		const status = { id: RepairStatusId.FINISHED_AND_PAID, description: 'Finalizada' }
		await showBadge(status)
		const badge = screen.getByText(status.description)

		expect(badge).toHaveClass('bg-default')
	})

	it('uses the destructive variant for a re-entered repair', async () => {
		const status = { id: RepairStatusId.REENTERED, description: 'Reingresado' }
		await showBadge(status)
		const badge = screen.getByText(status.description)

		expect(badge).toHaveClass('text-destructive')
	})

	it('uses the secondary variant for any other status', async () => {
		const status = { id: RepairStatusId.WAITING_FOR_SPARE_PARTS, description: 'Esperando repuestos' }
		await showBadge(status)
		const badge = screen.getByText(status.description)

		expect(badge).toHaveClass('bg-secondary')
	})
})
