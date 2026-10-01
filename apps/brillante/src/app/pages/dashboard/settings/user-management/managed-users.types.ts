import type { IUser } from '@domain/user/user.interface'

export interface ManagedUsersReadError {
	list: string | null
}

export interface ManagedUsersMutationError {
	create: string | null
	update: string | null
	delete: string | null
}

export interface ManagedUsersState {
	users: IUser[]
	searchQuery: string
	isLoadingList: boolean
	isCreating: boolean
	isUpdating: boolean
	isDeleting: boolean
	readError: ManagedUsersReadError
	mutationError: ManagedUsersMutationError
}

export const initialManagedUsersState: ManagedUsersState = {
	users: [],
	searchQuery: '',
	isLoadingList: false,
	isCreating: false,
	isUpdating: false,
	isDeleting: false,
	readError: { list: null },
	mutationError: { create: null, update: null, delete: null },
}
