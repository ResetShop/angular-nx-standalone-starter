import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'
import type { CashTransaction } from '@domain/cash/cash-transaction.model'
import type { PaymentMethod } from '@domain/cash/payment-method.model'
import { startOfDay } from 'date-fns'

export interface CashReadError {
	list: string | null
	detail: string | null
	concepts: string | null
	paymentMethods: string | null
}

export interface CashMutationError {
	create: string | null
	update: string | null
	delete: string | null
	open: string | null
	close: string | null
}

export interface CashState {
	transactions: CashTransaction[]
	selectedTransaction: CashTransaction | null
	/** The full concept tree as the API returns it; pickers read the `assignableConcepts` slice. */
	concepts: TransactionConceptDto[]
	paymentMethods: PaymentMethod[]
	/** Inclusive first day of the listed period. */
	dateFrom: Date
	/** Inclusive last day of the listed period. */
	dateTo: Date
	isLoadingList: boolean
	isLoadingDetail: boolean
	isLoadingConcepts: boolean
	isLoadingPaymentMethods: boolean
	isCreating: boolean
	isUpdating: boolean
	isDeleting: boolean
	isOpening: boolean
	isClosing: boolean
	readError: CashReadError
	mutationError: CashMutationError
}

export const initialCashReadError: CashReadError = { list: null, detail: null, concepts: null, paymentMethods: null }

export const initialCashMutationError: CashMutationError = {
	create: null,
	update: null,
	delete: null,
	open: null,
	close: null,
}

/**
 * The store opens on today; a factory keeps "today" fresh for every store instance.
 */
export function createInitialCashState(): CashState {
	const today = startOfDay(new Date())
	return {
		transactions: [],
		selectedTransaction: null,
		concepts: [],
		paymentMethods: [],
		dateFrom: today,
		dateTo: today,
		isLoadingList: false,
		isLoadingDetail: false,
		isLoadingConcepts: false,
		isLoadingPaymentMethods: false,
		isCreating: false,
		isUpdating: false,
		isDeleting: false,
		isOpening: false,
		isClosing: false,
		readError: { ...initialCashReadError },
		mutationError: { ...initialCashMutationError },
	}
}
