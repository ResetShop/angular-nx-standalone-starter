import type { IManagedUser } from '@domain/user-management/managed-user.interface';

export interface UsersReadError {
	list: string | null;
}

export interface UsersMutationError {
	create: string | null;
	update: string | null;
	updateStatus: string | null;
	delete: string | null;
}

export interface UsersState {
	users: IManagedUser[];
	selectedUser: IManagedUser | null;
	currentPage: number;
	pageSize: number;
	totalItems: number;
	searchQuery: string;
	isLoadingList: boolean;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	readError: UsersReadError;
	mutationError: UsersMutationError;
}

export const initialUsersState: UsersState = {
	users: [],
	selectedUser: null,
	currentPage: 1,
	pageSize: 10,
	totalItems: 0,
	searchQuery: '',
	isLoadingList: false,
	isCreating: false,
	isUpdating: false,
	isDeleting: false,
	readError: { list: null },
	mutationError: { create: null, update: null, updateStatus: null, delete: null },
};
