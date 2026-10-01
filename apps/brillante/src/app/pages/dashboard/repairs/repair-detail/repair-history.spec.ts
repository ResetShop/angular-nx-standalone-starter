import type { RepairStatusEntry } from '@domain/repair/repair.model'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import { RepairHistory } from './repair-history'

function createEntry(overrides: Partial<RepairStatusEntry> = {}): RepairStatusEntry {
	return {
		id: 1,
		status: { id: 1, description: 'En progreso' },
		cost: 100,
		price: 250.5,
		paymentInAdvance: 50,
		note: 'Se pidió el repuesto',
		userName: 'tecnico',
		changedAt: new Date(2024, 4, 2, 14, 30),
		...overrides,
	}
}

describe('RepairHistory', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	async function renderHistory(entries: RepairStatusEntry[]) {
		return render(RepairHistory, {
			inputs: { entries },
			providers: [{ provide: Translation, useValue: repairsTranslation }],
		})
	}

	it('explains that there is no history yet', async () => {
		await renderHistory([])

		expect(screen.getByText('This repair has no recorded status changes yet.')).toBeInTheDocument()
		expect(screen.queryByRole('list')).not.toBeInTheDocument()
	})

	it('lists one item per status change in the given order', async () => {
		await renderHistory([
			createEntry({ id: 2, status: { id: 5, description: 'Finalizada y abonada' } }),
			createEntry({ id: 1 }),
		])

		const items = screen.getAllByRole('listitem')
		expect(items).toHaveLength(2)
		expect(items[0]).toHaveTextContent('Finalizada y abonada')
		expect(items[1]).toHaveTextContent('En progreso')
	})

	it('shows the date, the author, the money figures and the note of a change', async () => {
		await renderHistory([createEntry()])

		const item = screen.getByRole('listitem')
		expect(item).toHaveTextContent('2024/05/02 14:30')
		expect(item).toHaveTextContent('tecnico')
		expect(item).toHaveTextContent('Price: $250.50')
		expect(item).toHaveTextContent('Cost: $100.00')
		expect(item).toHaveTextContent('Advance payment: $50.00')
		expect(item).toHaveTextContent('Se pidió el repuesto')
	})

	it('omits the author and the note when there are none', async () => {
		await renderHistory([createEntry({ userName: null, note: '' })])

		const item = screen.getByRole('listitem')
		expect(item).not.toHaveTextContent('tecnico')
		expect(item).not.toHaveTextContent('Se pidió el repuesto')
	})
})
