import type { PermissionData } from '@contracts/role/role.types';

export interface PermissionsReadError {
	list: string | null;
}

export interface PermissionsState {
	/** Raw DTO backing store — use store.permissions() for the mapped domain objects */
	_permissionsData: PermissionData[];
	isLoading: boolean;
	isCached: boolean;
	readError: PermissionsReadError;
}

export const initialPermissionsState: PermissionsState = {
	_permissionsData: [],
	isLoading: false,
	isCached: false,
	readError: { list: null },
};
