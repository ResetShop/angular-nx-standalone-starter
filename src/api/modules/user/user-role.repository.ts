import { and, count, eq } from 'drizzle-orm';
import { permission } from '../../../db/schema/permission';
import { role, rolePermission } from '../../../db/schema/role';
import { userRole } from '../../../db/schema/user';
import { PAGINATION_DEFAULTS } from '../../constants/pagination.constants';
import { BaseRepository } from '../../helpers/base.repository';
import type { PermissionData, RoleData } from '../role/interfaces';
import type { IUserRoleRepository, PaginatedResponse, PaginationParams } from './interfaces';

/**
 * Repository for user-role relationship database operations.
 * Handles role assignments, permission aggregation, and role membership checks.
 */
export class UserRoleRepository extends BaseRepository implements IUserRoleRepository {
	/**
	 * Retrieves all roles assigned to a user with pagination.
	 *
	 * @param userId - The user's primary key
	 * @param pagination - Optional pagination parameters
	 * @param pagination.offset - Number of records to skip (default: 0)
	 * @param pagination.limit - Maximum records to return (default: 10)
	 * @returns Paginated response containing roles and metadata
	 */
	async getUserRoles(userId: number, pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>> {
		const limit = pagination?.limit ?? PAGINATION_DEFAULTS.LIMIT;
		const offset = pagination?.offset ?? PAGINATION_DEFAULTS.OFFSET;

		const [data, totalResult] = await Promise.all([
			this.db
				.select({
					id: role.id,
					name: role.name,
					code: role.code,
					description: role.description,
					removable: role.removable,
					createdAt: role.createdAt,
					updatedAt: role.updatedAt,
				})
				.from(userRole)
				.innerJoin(role, eq(userRole.roleId, role.id))
				.where(eq(userRole.userId, userId))
				.limit(limit)
				.offset(offset),
			this.db.select({ count: count() }).from(userRole).where(eq(userRole.userId, userId)),
		]);

		return {
			data,
			total: totalResult[0].count,
			offset,
			limit,
		};
	}

	/**
	 * Retrieves all permissions for a user aggregated from all their assigned roles.
	 * Returns distinct permissions to avoid duplicates when multiple roles share permissions.
	 *
	 * @param userId - The user's primary key
	 * @returns Array of unique permissions across all user's roles
	 */
	async getUserPermissions(userId: number): Promise<PermissionData[]> {
		const result = await this.db
			.selectDistinct({
				id: permission.id,
				name: permission.name,
				description: permission.description,
				resource: permission.resource,
				action: permission.action,
			})
			.from(userRole)
			.innerJoin(rolePermission, eq(userRole.roleId, rolePermission.roleId))
			.innerJoin(permission, eq(rolePermission.permissionId, permission.id))
			.where(eq(userRole.userId, userId));

		return result;
	}

	/**
	 * Assigns a role to a user.
	 * Uses onConflictDoNothing to handle duplicate assignments gracefully.
	 *
	 * @param userId - The user's primary key
	 * @param roleId - The role's primary key to assign
	 */
	async assignRoleToUser(userId: number, roleId: number): Promise<void> {
		await this.db.insert(userRole).values({ userId, roleId }).onConflictDoNothing();
	}

	/**
	 * Removes a role assignment from a user.
	 *
	 * @param userId - The user's primary key
	 * @param roleId - The role's primary key to remove
	 * @returns true if the role was removed, false if it wasn't assigned
	 */
	async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
		const result = await this.db
			.delete(userRole)
			.where(and(eq(userRole.userId, userId), eq(userRole.roleId, roleId)))
			.returning({ id: userRole.id });

		return result.length > 0;
	}

	/**
	 * Checks if a user has a specific role assigned.
	 *
	 * @param userId - The user's primary key
	 * @param roleId - The role's primary key to check
	 * @returns true if the user has the role, false otherwise
	 */
	async userHasRole(userId: number, roleId: number): Promise<boolean> {
		const result = await this.db
			.select({ id: userRole.id })
			.from(userRole)
			.where(and(eq(userRole.userId, userId), eq(userRole.roleId, roleId)))
			.limit(1);

		return result.length > 0;
	}
}
