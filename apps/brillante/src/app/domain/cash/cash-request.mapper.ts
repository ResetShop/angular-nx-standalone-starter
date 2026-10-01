import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type {
	CashActorDto,
	CashTransactionRequest,
	PaymentMethodSnapshot,
} from '@contracts/cash/cash-transaction.types'
import type { IUser } from '@domain/user/user.interface'
import type { Operation } from './cash-transaction.model'
import { roundToCents } from './money'
import type { PaymentMethod } from './payment-method.model'

export interface PaymentDraft {
	readonly amount: number
	readonly paymentMethod: PaymentMethod
}

/**
 * What the transaction form collects. The transaction amount is not an input of its own: it is
 * the sum of the payments.
 */
export interface CashTransactionDraft {
	readonly id?: number
	readonly concept: TransactionConceptDto
	readonly note: string
	readonly date: Date
	readonly operation?: Operation | null
	readonly payments: readonly PaymentDraft[]
}

function toPaymentMethodSnapshot(method: PaymentMethod): PaymentMethodSnapshot {
	return {
		id: method.id,
		description: method.description,
		allowsInstallments: method.allowsInstallments,
		installments: method.installments.map((plan) => ({ ...plan })),
	}
}

/**
 * Builds the transaction body of `POST /cash/create` and `PUT /cash/update`. The first payment's
 * method is the transaction's headline method, as the API expects.
 */
export function toCashTransactionRequest(draft: CashTransactionDraft): CashTransactionRequest {
	const [firstPayment] = draft.payments
	const request: CashTransactionRequest = {
		concept: draft.concept,
		amount: roundToCents(draft.payments.reduce((sum, payment) => sum + payment.amount, 0)),
		date: draft.date.toISOString(),
		note: draft.note,
		paymentMethod: toPaymentMethodSnapshot(firstPayment.paymentMethod),
		payments: draft.payments.map((payment) => ({
			amount: payment.amount,
			paymentMethod: toPaymentMethodSnapshot(payment.paymentMethod),
		})),
	}
	if (draft.id !== undefined) request.id = draft.id
	if (draft.operation) request.operation = draft.operation
	return request
}

/**
 * Identifies the signed-in user to the cash endpoints; only the identity fields are sent, never
 * the derived permissions.
 */
export function toCashActor(user: IUser): CashActorDto {
	return {
		id: user.id,
		userName: user.userName,
		firstName: user.firstName,
		lastName: user.lastName,
		email: user.email,
		avatar: user.avatar,
		roles: user.roles.map((role) => ({ id: role.id, description: role.description })),
		hasFinishedRegistration: user.hasFinishedRegistration,
	}
}
