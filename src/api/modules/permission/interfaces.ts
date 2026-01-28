import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { PermissionData } from '../role/interfaces';

// ============================================================================
// Permission Repository & Service Interfaces
// ============================================================================

/**
 * Permission repository interface for querying system permissions.
 */
export interface IPermissionRepository {
	findAll(pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>>;
	count(): Promise<number>;
}

/**
 * Permission service interface for listing system permissions.
 */
export interface IPermissionService {
	list(pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>>;
}
