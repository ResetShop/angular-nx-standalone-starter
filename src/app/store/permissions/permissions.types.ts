import type { PermissionData } from '@contracts/role/role.types';

export interface PermissionsReadError {
	list: string | null;
}

export interface PermissionsState {
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
