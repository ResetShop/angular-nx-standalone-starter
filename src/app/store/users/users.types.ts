import type { IManagedUser } from '@domain/user-management/managed-user.interface';

export interface UsersState {
	users: IManagedUser[];
	selectedUser: IManagedUser | null;
	currentPage: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	searchQuery: string;
	isLoadingList: boolean;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	/** Error from the last failed list/search load */
	listError: string | null;
	/** Error from the last failed create/update/delete/updateStatus operation */
	mutationError: string | null;
}

export const initialUsersState: UsersState = {
	users: [],
	selectedUser: null,
	currentPage: 1,
	pageSize: 10,
	totalItems: 0,
	totalPages: 0,
	searchQuery: '',
	isLoadingList: false,
	isCreating: false,
	isUpdating: false,
	isDeleting: false,
	listError: null,
	mutationError: null,
};
