import type { CashTransactionDto } from '@contracts/cash/cash-transaction.types'
import { parseISO } from 'date-fns'
import { type CashTransaction, TransactionTypeId } from './cash-transaction.model'
import { toPaymentMethod } from './payment-method.model'

function parseOptionalDate(value: string | null | undefined): Date | null {
	return value ? parseISO(value) : null
}

/**
 * Maps a wire transaction to the domain model: the date fields become `Date`s and the decimal
 * strings become numbers, so neither stores nor pages ever parse them.
 */
export function toCashTransaction(dto: CashTransactionDto): CashTransaction {
	const parent = dto.concept.parent
	return {
		id: dto.id,
		concept: dto.concept,
		kind: dto.concept.transactionType.id === TransactionTypeId.INCOME ? 'income' : 'expense',
		amount: Number(dto.amount),
		date: parseISO(dto.date),
		note: dto.note ?? '',
		operation: dto.operation ?? null,
		paymentMethod: toPaymentMethod(dto.paymentMethod),
		payments: (dto.payments ?? []).map((payment) => ({
			amount: Number(payment.amount),
			paymentMethod: toPaymentMethod(payment.paymentMethod),
		})),
		createdAt: parseOptionalDate(dto.audit?.createdAt),
		updatedAt: parseOptionalDate(dto.audit?.updatedAt),
		createdByUserName: dto.audit?.createdBy?.userName ?? null,
		// The API flags concepts with 0/1 rather than booleans.
		editable: Boolean(dto.concept.userAssignable) && Boolean(parent?.userAssignable ?? true),
	}
}
