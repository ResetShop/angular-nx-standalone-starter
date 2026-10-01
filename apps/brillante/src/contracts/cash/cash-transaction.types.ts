import type { OfficeBranchDto } from '../office-branch/office-branch.types'
import type { UserDto } from '../user/user.types'
import type { TransactionConceptDto } from './cash-concept.types'
import type { PaymentMethodRefDto } from './payment-method.types'

/**
 * Operation (sale, repair, purchase) a cash transaction was generated from.
 */
export interface OperationDto {
	id: number
	description: string
}

export interface PaymentDto {
	/** Decimal string (e.g. `"1500.00"`) or a plain number, depending on the column the API read it from. */
	amount: string | number
	paymentMethod: PaymentMethodRefDto
}

export interface CashTransactionAuditDto {
	createdAt: string
	updatedAt: string
	createdBy: UserDto | null
	deleted: boolean
	enabled: boolean
}

/**
 * Wire shape of `GET /cash` rows and `GET /cash/getById/:id`: amounts arrive as decimal strings and
 * dates as ISO-8601 strings.
 */
export interface CashTransactionDto {
	id: number
	concept: TransactionConceptDto
	amount: string | number
	date: string
	note: string
	audit: CashTransactionAuditDto
	operation: OperationDto | null
	paymentMethod: PaymentMethodRefDto
	payments: PaymentDto[]
	officeBranch?: OfficeBranchDto
}

/**
 * Payment method snapshot the API expects inside a transaction: interest rates travel as numbers.
 */
export interface PaymentMethodSnapshot {
	id: number
	description: string
	allowsInstallments: boolean
	installments: { installments: number; interestRate: number }[]
}

export interface PaymentRequest {
	amount: number
	paymentMethod: PaymentMethodSnapshot
}

/**
 * Transaction body of `POST /cash/create` and `PUT /cash/update`.
 */
export interface CashTransactionRequest {
	id?: number
	concept: TransactionConceptDto
	amount: number
	/** ISO-8601 instant, as produced by `Date#toISOString()`. */
	date: string
	note: string
	operation?: OperationDto | null
	paymentMethod: PaymentMethodSnapshot
	payments: PaymentRequest[]
}

/**
 * User who performs a cash operation; the API records it as the transaction author.
 */
export interface CashActorDto {
	id: number
	userName: string
	firstName: string
	lastName: string
	email: string
	avatar: string | null
	roles: { id: number; description: string }[]
	hasFinishedRegistration: boolean
}

/**
 * Filters of `GET /cash`. Both bounds are inclusive days; the provider widens them to the whole day.
 */
export interface CashTransactionQuery {
	from: Date
	to: Date
	branchId?: number
}
