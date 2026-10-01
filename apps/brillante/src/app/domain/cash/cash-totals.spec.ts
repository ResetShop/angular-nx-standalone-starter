import { createMockCashTransactionDto } from '@providers/cash/cash.mock'
import { summarizeTransactions, toSignedAmount } from './cash-totals'
import { toCashTransaction } from './cash-transaction.mapper'

function build(kind: 'income' | 'expense', amount: string) {
	const dto = createMockCashTransactionDto({ amount })
	const typeId = kind === 'income' ? 1 : 0
	return toCashTransaction({ ...dto, concept: { ...dto.concept, transactionType: { id: typeId, description: kind } } })
}

describe('summarizeTransactions', () => {
	it('should return zeros for an empty list', () => {
		expect(summarizeTransactions([])).toEqual({ incomes: 0, expenses: 0, balance: 0 })
	})

	it('should add incomes and expenses separately and compute the balance', () => {
		const totals = summarizeTransactions([
			build('income', '1000'),
			build('income', '250.50'),
			build('expense', '300.25'),
		])

		expect(totals).toEqual({ incomes: 1250.5, expenses: 300.25, balance: 950.25 })
	})

	it('should produce a negative balance when expenses exceed incomes', () => {
		expect(summarizeTransactions([build('income', '100'), build('expense', '250')]).balance).toBe(-150)
	})

	it('should not accumulate floating-point drift', () => {
		const totals = summarizeTransactions([build('income', '0.1'), build('income', '0.2')])

		expect(totals.incomes).toBe(0.3)
	})
})

describe('toSignedAmount', () => {
	it('should keep incomes positive', () => {
		expect(toSignedAmount(build('income', '80'))).toBe(80)
	})

	it('should negate expenses', () => {
		expect(toSignedAmount(build('expense', '80'))).toBe(-80)
	})
})
