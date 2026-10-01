import type { ICustomer } from '@domain/customer/customer.interface'

export interface CustomersReadError {
	list: string | null
}

export interface CustomersMutationError {
	create: string | null
	update: string | null
}

/**
 * Outcome of the last create: `existing` means the API found a customer with the same DNI and
 * returned it instead of inserting a new row.
 */
export type CustomerCreateOutcome = 'created' | 'existing'

export interface CustomersState {
	customers: ICustomer[]
	currentPage: number
	pageSize: number
	totalItems: number
	/** DNI or email typed in the search box; empty lists every customer. */
	searchQuery: string
	isLoadingList: boolean
	isCreating: boolean
	isUpdating: boolean
	createOutcome: CustomerCreateOutcome | null
	readError: CustomersReadError
	mutationError: CustomersMutationError
}

export const initialCustomersState: CustomersState = {
	customers: [],
	currentPage: 1,
	pageSize: 10,
	totalItems: 0,
	searchQuery: '',
	isLoadingList: false,
	isCreating: false,
	isUpdating: false,
	createOutcome: null,
	readError: { list: null },
	mutationError: { create: null, update: null },
}
