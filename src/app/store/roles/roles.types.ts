import type { RoleData } from '@contracts/role/role.types';
import type { IRole } from '@domain/access/role.interface';

export interface RolesState {
	/** Paginated roles for the current page (plain DTO — no permissions) */
	roles: RoleData[];
	/** Unpaginated roles for dropdowns (plain DTO — no permissions) */
	allRoles: RoleData[];
	/** Full domain model with permissions, loaded via getByIdWithPermissions() */
	selectedRole: IRole | null;
	currentPage: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	searchQuery: string;
	isLoadingList: boolean;
	isLoadingAll: boolean;
	isLoadingDetail: boolean;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	isAssigningPermissions: boolean;
	/** Error from the last failed list/detail load */
	readError: string | null;
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
	readError: null,
	mutationError: null,
};
