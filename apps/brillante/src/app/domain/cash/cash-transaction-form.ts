import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import { parseDateTimeInputValue, toDateTimeInputValue } from './cash-date'
import type { CashTransactionDraft, PaymentDraft } from './cash-request.mapper'
import type { CashTransaction } from './cash-transaction.model'
import type { PaymentMethod } from './payment-method.model'

/**
 * Text-based form values: selects and date inputs work with strings, the draft converts them.
 */
export interface PaymentFormModel {
	amount: number
	paymentMethodId: string
	/** Number of instalments chosen for a method that offers them; empty otherwise. */
	installments: string
}

export interface CashTransactionFormModel {
	parentConceptId: string
	conceptId: string
	payments: PaymentFormModel[]
	note: string
	/** `datetime-local` value; only editable when an existing transaction is edited. */
	date: string
}

export interface CashTransactionFormSource {
	readonly transaction: CashTransaction | null
	/** Assignable concepts: roots carrying their assignable children. */
	readonly concepts: readonly TransactionConceptDto[]
	readonly paymentMethods: readonly PaymentMethod[]
}

function firstConceptIds(concepts: readonly TransactionConceptDto[]): { parentId: string; conceptId: string } {
	const parent = concepts[0]
	return {
		parentId: parent ? String(parent.id) : '',
		conceptId: parent?.children[0] ? String(parent.children[0].id) : '',
	}
}

/**
 * Seeds the form: a new transaction starts on the first concept and payment method, an existing one
 * on its own values (one payment row per payment it already has).
 */
export function createCashTransactionFormModel({
	transaction,
	concepts,
	paymentMethods,
}: CashTransactionFormSource): CashTransactionFormModel {
	const defaults = firstConceptIds(concepts)
	const defaultMethodId = paymentMethods[0] ? String(paymentMethods[0].id) : ''

	if (!transaction) {
		return {
			parentConceptId: defaults.parentId,
			conceptId: defaults.conceptId,
			payments: [{ amount: 0, paymentMethodId: defaultMethodId, installments: '' }],
			note: '',
			date: toDateTimeInputValue(new Date()),
		}
	}

	const payments =
		transaction.payments.length > 0
			? transaction.payments
			: [{ amount: transaction.amount, paymentMethod: transaction.paymentMethod }]
	return {
		parentConceptId: transaction.concept.parent ? String(transaction.concept.parent.id) : defaults.parentId,
		conceptId: String(transaction.concept.id),
		payments: payments.map((payment) => ({
			amount: payment.amount,
			paymentMethodId: String(payment.paymentMethod.id),
			installments: '',
		})),
		note: transaction.note,
		date: toDateTimeInputValue(transaction.date),
	}
}

/**
 * Builds the draft to save, or `null` when the chosen concept or a payment method is unknown.
 * A new transaction is stamped with `now`; an existing one keeps the date typed in the form.
 */
export function toCashTransactionDraft(
	model: CashTransactionFormModel,
	source: CashTransactionFormSource,
	now: Date = new Date(),
): CashTransactionDraft | null {
	const parent = source.concepts.find((concept) => String(concept.id) === model.parentConceptId)
	const concept = parent?.children.find((child) => String(child.id) === model.conceptId)
	const payments: PaymentDraft[] = []
	for (const payment of model.payments) {
		const paymentMethod = source.paymentMethods.find((method) => String(method.id) === payment.paymentMethodId)
		if (!paymentMethod) return null
		payments.push({ amount: payment.amount, paymentMethod })
	}
	if (!concept || payments.length === 0) return null

	const existing = source.transaction
	return {
		id: existing?.id,
		concept,
		note: model.note.trim(),
		date: existing ? (parseDateTimeInputValue(model.date) ?? existing.date) : now,
		operation: existing?.operation ?? null,
		payments,
	}
}
