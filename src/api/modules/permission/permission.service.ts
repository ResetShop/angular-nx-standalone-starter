import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { PermissionData } from '../role/interfaces';
import type { IPermissionRepository, IPermissionService } from './interfaces';

interface PermissionServiceDeps {
	permissionRepository: IPermissionRepository;
}

/**
 * Service for permission listing operations.
 * Provides read-only access to system permissions with pagination.
 */
export class PermissionService implements IPermissionService {
	private permissionRepository: IPermissionRepository;

	constructor({ permissionRepository }: PermissionServiceDeps) {
		this.permissionRepository = permissionRepository;
	}

	/**
	 * Retrieves all system permissions with pagination support.
	 *
	 * @param pagination - Optional pagination parameters (offset, limit)
	 * @returns Paginated response containing permissions and metadata
	 */
	async list(pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>> {
		return this.permissionRepository.findAll(pagination);
	}
}
