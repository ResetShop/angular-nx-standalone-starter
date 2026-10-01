import type { CashTransaction } from './cash-transaction.model'
import { roundToCents } from './money'

export interface CashTotals {
	readonly incomes: number
	readonly expenses: number
	readonly balance: number
}

export function summarizeTransactions(transactions: readonly CashTransaction[]): CashTotals {
	const sumOf = (kind: CashTransaction['kind']) =>
		roundToCents(
			transactions.filter((transaction) => transaction.kind === kind).reduce((sum, { amount }) => sum + amount, 0),
		)
	const incomes = sumOf('income')
	const expenses = sumOf('expense')
	return { incomes, expenses, balance: roundToCents(incomes - expenses) }
}

/**
 * Amount with the sign the cash balance sees: incomes add, expenses subtract.
 */
export function toSignedAmount(transaction: CashTransaction): number {
	return transaction.kind === 'income' ? transaction.amount : -transaction.amount
}
