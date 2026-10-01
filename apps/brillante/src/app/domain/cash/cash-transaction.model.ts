import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type { PaymentMethod } from './payment-method.model'

/**
 * Ids the API uses for the transaction type of a concept.
 */
export const TransactionTypeId = Object.freeze({
	EXPENSE: 0,
	INCOME: 1,
} as const)

export type TransactionKind = 'income' | 'expense'

export interface Payment {
	readonly amount: number
	readonly paymentMethod: PaymentMethod
}

export interface Operation {
	readonly id: number
	readonly description: string
}

export interface CashTransaction {
	readonly id: number
	readonly concept: TransactionConceptDto
	readonly kind: TransactionKind
	/** Always positive; `kind` tells whether it is money in or out. */
	readonly amount: number
	readonly date: Date
	readonly note: string
	readonly operation: Operation | null
	readonly paymentMethod: PaymentMethod
	readonly payments: readonly Payment[]
	readonly createdAt: Date | null
	readonly updatedAt: Date | null
	readonly createdByUserName: string | null
	/** Whether the user may edit the transaction: operation-generated concepts are read-only. */
	readonly editable: boolean
}
