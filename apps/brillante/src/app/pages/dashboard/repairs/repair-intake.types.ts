import type { RepairCustomer } from '@domain/repair/repair.model'

/**
 * Outcome of looking a customer up by DNI while opening a repair: `found` fills the customer
 * section from the stored customer, `not-found` means a new customer is registered with the repair.
 */
export type CustomerLookupStatus = 'idle' | 'loading' | 'found' | 'not-found'

export interface RepairIntakeReadError {
	lookup: string | null
}

export interface RepairIntakeMutationError {
	create: string | null
}

export interface RepairIntakeState {
	lookupStatus: CustomerLookupStatus
	customer: RepairCustomer | null
	createdRepairId: number | null
	isCreating: boolean
	readError: RepairIntakeReadError
	mutationError: RepairIntakeMutationError
}

export const initialRepairIntakeState: RepairIntakeState = {
	lookupStatus: 'idle',
	customer: null,
	createdRepairId: null,
	isCreating: false,
	readError: { lookup: null },
	mutationError: { create: null },
}
