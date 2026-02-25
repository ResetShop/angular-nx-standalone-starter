import type { PaginatedResponse } from '../../../interfaces';
import type { PermissionData } from '../role/interfaces';
import type { IPermissionRepository, IPermissionService, ListPermissionsParams } from './interfaces';

interface PermissionServiceDeps {
	permissionRepository: IPermissionRepository;
}

/**
 * Service for permission listing operations.
 * Provides read-only access to system permissions with pagination and search.
 */
export class PermissionService implements IPermissionService {
	private permissionRepository: IPermissionRepository;

	constructor({ permissionRepository }: PermissionServiceDeps) {
		this.permissionRepository = permissionRepository;
	}

	/**
	 * Retrieves all system permissions with pagination and optional search filtering.
	 *
	 * @param params - Optional parameters (offset, limit, search)
	 * @returns Paginated response containing permissions and metadata
	 */
	async getAllPermissions(params?: ListPermissionsParams): Promise<PaginatedResponse<PermissionData>> {
		return this.permissionRepository.findAll(params);
	}
}
