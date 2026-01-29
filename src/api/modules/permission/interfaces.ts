import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { PermissionData } from '../role/interfaces';

/**
 * Parameters for listing permissions with optional search filtering.
 */
export interface ListPermissionsParams extends PaginationParams {
	search?: string;
}

/**
 * Permission repository interface for querying system permissions.
 */
export interface IPermissionRepository {
	findAll(params?: ListPermissionsParams): Promise<PaginatedResponse<PermissionData>>;
	count(): Promise<number>;
}

/**
 * Permission service interface for listing system permissions.
 */
export interface IPermissionService {
	list(params?: ListPermissionsParams): Promise<PaginatedResponse<PermissionData>>;
}
