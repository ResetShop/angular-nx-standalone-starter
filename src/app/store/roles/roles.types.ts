import type { RoleData } from '@contracts/role/role.types';
import type { IRole } from '@domain/access/role.interface';

export interface RolesState {
	/** All roles on the current page */
	roles: RoleData[];
	/** All roles for dropdowns (unpaginated) */
	allRoles: RoleData[];
	/** Currently selected role with full permission data */
	selectedRole: IRole | null;
	/** Current 1-based page number */
	currentPage: number;
	/** Number of items per page */
	pageSize: number;
	/** Total number of roles matching the current search query */
	totalItems: number;
	/** Total number of pages */
	totalPages: number;
	/** Active search query string */
	searchQuery: string;
	/** Whether the paginated list is being loaded */
	isLoadingList: boolean;
	/** Whether the unpaginated full list is being loaded */
	isLoadingAll: boolean;
	/** Whether a role detail (with permissions) is being loaded */
	isLoadingDetail: boolean;
	/** Whether a create operation is in progress */
	isCreating: boolean;
	/** Whether an update operation is in progress */
	isUpdating: boolean;
	/** Whether a delete operation is in progress */
	isDeleting: boolean;
	/** Whether a permission assignment is in progress */
	isAssigningPermissions: boolean;
	/** Error from the last failed list/detail load */
	listError: string | null;
	/** Error from the last failed create/update/delete/assignPermissions operation */
	mutationError: string | null;
}

export const initialRolesState: RolesState = {
	roles: [],
	allRoles: [],
	selectedRole: null,
	currentPage: 1,
	pageSize: 10,
	totalItems: 0,
	totalPages: 0,
	searchQuery: '',
	isLoadingList: false,
	isLoadingAll: false,
	isLoadingDetail: false,
	isCreating: false,
	isUpdating: false,
	isDeleting: false,
	isAssigningPermissions: false,
	listError: null,
	mutationError: null,
};
