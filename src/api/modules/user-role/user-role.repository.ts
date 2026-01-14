import { and, count, eq } from 'drizzle-orm';
import { permission } from '../../../db/schema/permission';
import { role, rolePermission } from '../../../db/schema/role';
import { userRole } from '../../../db/schema/user';
import { BaseRepository } from '../../helpers/base.repository';
import type { IUserRoleRepository, PaginatedResponse, PaginationParams, PermissionData, RoleData } from './interfaces';

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;

export class UserRoleRepository extends BaseRepository implements IUserRoleRepository {
	/**
	 * Get all roles assigned to a user with pagination
	 */
	async getUserRoles(userId: number, pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>> {
		const limit = pagination?.limit ?? DEFAULT_LIMIT;
		const offset = pagination?.offset ?? DEFAULT_OFFSET;

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
	 * Get all permissions for a user (aggregated from all their roles)
	 * Returns distinct permissions across all roles
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
	 * Assign a role to a user
	 * Uses onConflictDoNothing to handle duplicate assignments gracefully
	 */
	async assignRoleToUser(userId: number, roleId: number): Promise<void> {
		await this.db.insert(userRole).values({ userId, roleId }).onConflictDoNothing();
	}

	/**
	 * Remove a role from a user
	 * @returns true if a role was removed, false if it wasn't assigned
	 */
	async removeRoleFromUser(userId: number, roleId: number): Promise<boolean> {
		const result = await this.db
			.delete(userRole)
			.where(and(eq(userRole.userId, userId), eq(userRole.roleId, roleId)))
			.returning({ id: userRole.id });

		return result.length > 0;
	}

	/**
	 * Check if a user has a specific role
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
