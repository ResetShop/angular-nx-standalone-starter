import type { IManagedUser } from '@domain/user-management/managed-user.interface';

export interface UsersState {
	/** All users on the current page */
	users: IManagedUser[];
	/** Currently selected user for detail/edit operations */
	selectedUser: IManagedUser | null;
	/** Current 1-based page number */
	currentPage: number;
	/** Number of items per page */
	pageSize: number;
	/** Total number of users matching the current search query */
	totalItems: number;
	/** Total number of pages */
	totalPages: number;
	/** Active search query string */
	searchQuery: string;
	/** Whether the list is being loaded or reloaded */
	isLoadingList: boolean;
	/** Whether a create operation is in progress */
	isCreating: boolean;
	/** Whether an update or status-change operation is in progress */
	isUpdating: boolean;
	/** Whether a delete operation is in progress */
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
