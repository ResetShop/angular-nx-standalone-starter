import type { PermissionData } from '@contracts/role/role.types';

export interface PermissionsState {
	/** Flat list of all system permissions */
	permissions: PermissionData[];
	/** Whether a fetch is in flight */
	isLoading: boolean;
	/** Whether permissions have been successfully loaded at least once */
	isCached: boolean;
	/** Error from the last failed load */
	error: string | null;
}

export const initialPermissionsState: PermissionsState = {
	permissions: [],
	isLoading: false,
	isCached: false,
	error: null,
};
