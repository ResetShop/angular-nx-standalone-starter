import type { ICustomer } from '@domain/customer/customer.interface'

export interface ProfileReadError {
	customer: string | null
}

export interface ProfileMutationError {
	save: string | null
}

export interface ProfileState {
	/** The signed-in user's customer record; null until loaded or when none exists. */
	customer: ICustomer | null
	isLoading: boolean
	isSaving: boolean
	readError: ProfileReadError
	mutationError: ProfileMutationError
}

export const initialProfileState: ProfileState = {
	customer: null,
	isLoading: false,
	isSaving: false,
	readError: { customer: null },
	mutationError: { save: null },
}
