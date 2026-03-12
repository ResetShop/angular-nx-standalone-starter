import type { RoleData } from '@contracts/role/role.types';
import type { IRole } from '@domain/access/role.interface';

export interface RolesReadError {
	list: string | null;
	detail: string | null;
	all: string | null;
}

export interface RolesMutationError {
	create: string | null;
	update: string | null;
	delete: string | null;
	assignPermissions: string | null;
}

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
	searchQuery: string;
	isLoadingList: boolean;
	isLoadingAll: boolean;
	isLoadingDetail: boolean;
	isCreating: boolean;
	isUpdating: boolean;
	isDeleting: boolean;
	isAssigningPermissions: boolean;
	readError: RolesReadError;
	mutationError: RolesMutationError;
}

export const initialRolesState: RolesState = {
	roles: [],
	allRoles: [],
	selectedRole: null,
	currentPage: 1,
	pageSize: 10,
	totalItems: 0,
	searchQuery: '',
	isLoadingList: false,
	isLoadingAll: false,
	isLoadingDetail: false,
	isCreating: false,
	isUpdating: false,
	isDeleting: false,
	isAssigningPermissions: false,
	readError: { list: null, detail: null, all: null },
	mutationError: { create: null, update: null, delete: null, assignPermissions: null },
};
