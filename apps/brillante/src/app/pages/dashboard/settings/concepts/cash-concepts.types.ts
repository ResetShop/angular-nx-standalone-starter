import type { TransactionConceptDto } from '@contracts/cash/cash-concept.types'

export interface CashConceptsReadError {
	list: string | null
}

export interface CashConceptsMutationError {
	create: string | null
	update: string | null
	setEnabled: string | null
}

export interface CashConceptsState {
	/** The concept tree exactly as the API returns it; the domain view is derived from it. */
	tree: TransactionConceptDto[]
	/** Transaction type the table is narrowed to, or null to list every type. */
	typeFilter: number | null
	isLoadingList: boolean
	isCreating: boolean
	isUpdating: boolean
	isChangingStatus: boolean
	readError: CashConceptsReadError
	mutationError: CashConceptsMutationError
}

export const initialCashConceptsState: CashConceptsState = {
	tree: [],
	typeFilter: null,
	isLoadingList: false,
	isCreating: false,
	isUpdating: false,
	isChangingStatus: false,
	readError: { list: null },
	mutationError: { create: null, update: null, setEnabled: null },
}
