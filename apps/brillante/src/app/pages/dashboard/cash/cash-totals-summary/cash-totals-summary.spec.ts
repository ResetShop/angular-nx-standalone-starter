import { cashTranslation } from '@providers/cash/cash.testing'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { render, screen } from '@testing-library/angular'
import { CashTotalsSummary } from './cash-totals-summary'

describe('CashTotalsSummary', () => {
	async function renderSummary(totals: { incomes: number; expenses: number; balance: number }) {
		return render(CashTotalsSummary, {
			inputs: { totals },
			providers: [{ provide: Translation, useValue: cashTranslation }],
		})
	}

	it('should label the region', async () => {
		await renderSummary({ incomes: 0, expenses: 0, balance: 0 })

		expect(screen.getByRole('region', { name: 'Totals of the selected period' })).toBeInTheDocument()
	})

	it('should show the incomes, expenses and balance formatted as money', async () => {
		await renderSummary({ incomes: 1250.5, expenses: 300.25, balance: 950.25 })

		expect(screen.getByText('$ 1.250,50')).toBeInTheDocument()
		expect(screen.getByText('$ 300,25')).toBeInTheDocument()
		expect(screen.getByText('$ 950,25')).toBeInTheDocument()
	})

	it('should show zeros for an empty period', async () => {
		await renderSummary({ incomes: 0, expenses: 0, balance: 0 })

		expect(screen.getAllByText('$ 0,00')).toHaveLength(3)
	})
})
