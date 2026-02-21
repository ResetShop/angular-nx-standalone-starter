import { and, count, eq, inArray } from 'drizzle-orm';
import { permission } from '../../../db/schema/permission';
import { role, rolePermission } from '../../../db/schema/role';
import { userRole } from '../../../db/schema/user';
import { QUERY_DEFAULTS } from '../../constants/query.constants';
import { BaseRepository } from '../../helpers/base.repository';
import { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { PermissionData, RoleData, RoleWithPermissions } from '../access/role/interfaces';
import type { IUserRoleRepository } from './interfaces';
import { USER_ROLE_ERRORS, userRoleErrors } from './user-role.service';

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
		const limit = pagination?.limit ?? QUERY_DEFAULTS.LIMIT;
		const offset = pagination?.offset ?? QUERY_DEFAULTS.OFFSET;

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
	 * Retrieves all roles assigned to a user with their permissions nested.
	 * Uses Drizzle's relational query API for cleaner data fetching.
	 *
	 * @param userId - The user's primary key
	 * @returns Array of roles with nested permissions
	 */
	async getUserRolesWithPermissions(userId: number): Promise<RoleWithPermissions[]> {
		const userRolesWithData = await this.db.query.userRole.findMany({
			where: eq(userRole.userId, userId),
			with: {
				role: {
					with: {
						permissions: {
							with: {
								permission: true,
							},
						},
					},
				},
			},
		});

		return userRolesWithData.map((ur) => ({
			id: ur.role.id,
			code: ur.role.code,
			name: ur.role.name,
			description: ur.role.description,
			permissions: ur.role.permissions.map((rp) => ({
				id: rp.permission.id,
				name: rp.permission.name,
				description: rp.permission.description,
				resource: rp.permission.resource,
				action: rp.permission.action,
			})),
		}));
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
	 * @returns true if the role was assigned, false if already assigned
	 */
	async assignRoleToUser(userId: number, roleId: number): Promise<boolean> {
		const result = await this.db
			.insert(userRole)
			.values({ userId, roleId })
			.onConflictDoNothing()
			.returning({ id: userRole.id });

		return result.length > 0;
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

	/**
	 * Replaces all role assignments for a user.
	 * Validates that all role IDs exist before replacing.
	 * Removes existing roles and assigns the new ones in a transaction.
	 *
	 * @param userId - The user's primary key
	 * @param roleIds - Array of role IDs to assign (replaces existing)
	 * @throws Error if any role ID does not exist
	 */
	async replaceUserRoles(userId: number, roleIds: number[]): Promise<void> {
		if (roleIds.length > 0) {
			const missingIds = await this.findMissingRoleIds(roleIds);
			if (missingIds.length > 0) {
				throw new Error(`${USER_ROLE_ERRORS.ROLES_NOT_FOUND}: ${missingIds.join(', ')}`);
			}
		}

		const missingNonRemovable = await this.findUserNonRemovableRoleIdsNotIn(userId, roleIds);
		if (missingNonRemovable.length > 0) {
			throw userRoleErrors.nonRemovableRoles(missingNonRemovable);
		}

		await this.db.transaction(async (tx) => {
			await tx.delete(userRole).where(eq(userRole.userId, userId));

			if (roleIds.length > 0) {
				const values = roleIds.map((roleId) => ({ userId, roleId }));
				await tx.insert(userRole).values(values);
			}
		});
	}

	private async findUserNonRemovableRoleIdsNotIn(userId: number, roleIds: number[]): Promise<number[]> {
		const result = await this.db
			.select({ roleId: userRole.roleId })
			.from(userRole)
			.innerJoin(role, eq(userRole.roleId, role.id))
			.where(and(eq(userRole.userId, userId), eq(role.removable, false)));

		const roleIdSet = new Set(roleIds);
		return result.map((r) => r.roleId).filter((id) => !roleIdSet.has(id));
	}

	private async findMissingRoleIds(roleIds: number[]): Promise<number[]> {
		const result = await this.db.select({ id: role.id }).from(role).where(inArray(role.id, roleIds));

		const existingIds = new Set(result.map((r) => r.id));
		return roleIds.filter((id) => !existingIds.has(id));
	}
}
