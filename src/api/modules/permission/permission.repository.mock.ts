import { PAGINATION_DEFAULTS } from '../../constants/pagination.constants';
import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { PermissionData } from '../role/interfaces';
import type { IPermissionRepository } from './interfaces';

export class MockPermissionRepository implements IPermissionRepository {
	private permissions: PermissionData[] = [];

	/**
	 * Add a permission to the mock repository for testing.
	 */
	addPermission(permission: PermissionData): void {
		this.permissions.push(permission);
	}

	/**
	 * Clear all data from the mock repository.
	 */
	clear(): void {
		this.permissions = [];
	}

	async findAll(pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>> {
		const limit = pagination?.limit ?? PAGINATION_DEFAULTS.LIMIT;
		const offset = pagination?.offset ?? PAGINATION_DEFAULTS.OFFSET;

		const data = this.permissions.slice(offset, offset + limit);

		return {
			data,
			total: this.permissions.length,
			offset,
			limit,
		};
	}

	async count(): Promise<number> {
		return this.permissions.length;
	}
}
