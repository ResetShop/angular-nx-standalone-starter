import type { ManagedUser } from '@domain/user/managed-user.interface'

export interface ManagedUsersReadError {
	list: string | null
}

export interface ManagedUsersMutationError {
	update: string | null
	delete: string | null
}

export interface ManagedUsersState {
	users: ManagedUser[]
	searchQuery: string
	isLoadingList: boolean
	isUpdating: boolean
	isDeleting: boolean
	readError: ManagedUsersReadError
	mutationError: ManagedUsersMutationError
}

export const initialManagedUsersState: ManagedUsersState = {
	users: [],
	searchQuery: '',
	isLoadingList: false,
	isUpdating: false,
	isDeleting: false,
	readError: { list: null },
	mutationError: { update: null, delete: null },
}
