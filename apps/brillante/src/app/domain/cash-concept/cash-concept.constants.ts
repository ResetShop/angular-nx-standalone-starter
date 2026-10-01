import type { TransactionTypeDto } from '@contracts/cash/cash-concept.types'

/**
 * Transaction types are fixed by the backend: a concept either adds money to the cash register
 * (income) or takes it out (expense).
 */
export const TransactionTypeId = Object.freeze({
	EXPENSE: 0,
	INCOME: 1,
} as const)

export type TransactionTypeId = (typeof TransactionTypeId)[keyof typeof TransactionTypeId]

/**
 * Wire representation of the transaction types, sent verbatim when creating a concept.
 */
export const TRANSACTION_TYPES: readonly TransactionTypeDto[] = Object.freeze([
	{ id: TransactionTypeId.EXPENSE, description: 'Egreso' },
	{ id: TransactionTypeId.INCOME, description: 'Ingreso' },
])
