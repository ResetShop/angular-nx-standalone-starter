import { count } from 'drizzle-orm';
import { permission } from '../../../db/schema/permission';
import { PAGINATION_DEFAULTS } from '../../constants/pagination.constants';
import { BaseRepository } from '../../helpers/base.repository';
import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { PermissionData } from '../role/interfaces';
import type { IPermissionRepository } from './interfaces';

/**
 * Repository for permission-related database operations.
 * Provides read-only access to system permissions with pagination support.
 */
export class PermissionRepository extends BaseRepository implements IPermissionRepository {
	/**
	 * Retrieves all permissions with pagination support.
	 *
	 * @param pagination - Optional pagination parameters
	 * @param pagination.offset - Number of records to skip (default: 0)
	 * @param pagination.limit - Maximum records to return (default: 10)
	 * @returns Paginated response containing permissions and metadata
	 */
	async findAll(pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>> {
		const limit = pagination?.limit ?? PAGINATION_DEFAULTS.LIMIT;
		const offset = pagination?.offset ?? PAGINATION_DEFAULTS.OFFSET;

		const [data, totalResult] = await Promise.all([
			this.db
				.select({
					id: permission.id,
					name: permission.name,
					description: permission.description,
					resource: permission.resource,
					action: permission.action,
				})
				.from(permission)
				.limit(limit)
				.offset(offset),
			this.db.select({ count: count() }).from(permission),
		]);

		return {
			data,
			total: totalResult[0].count,
			offset,
			limit,
		};
	}

	/**
	 * Returns the total number of permissions in the system.
	 *
	 * @returns Total permission count
	 */
	async count(): Promise<number> {
		const result = await this.db.select({ count: count() }).from(permission);
		return result[0].count;
	}
}
