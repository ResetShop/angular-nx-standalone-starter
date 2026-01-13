import { count, eq } from 'drizzle-orm';
import { permission } from '../../../db/schema/permission';
import { role, rolePermission } from '../../../db/schema/role';
import { BaseRepository } from '../../helpers/base.repository';
import type {
	CreateRoleParams,
	IRoleRepository,
	PaginatedResponse,
	PaginationParams,
	PermissionData,
	RoleData,
	UpdateRoleParams,
} from './interfaces';

const DEFAULT_LIMIT = 10;
const DEFAULT_OFFSET = 0;

export class RoleRepository extends BaseRepository implements IRoleRepository {
	/**
	 * Find a role by its ID
	 */
	async findById(id: number): Promise<RoleData | null> {
		const result = await this.db
			.select({
				id: role.id,
				name: role.name,
				code: role.code,
				description: role.description,
				removable: role.removable,
				createdAt: role.createdAt,
				updatedAt: role.updatedAt,
			})
			.from(role)
			.where(eq(role.id, id))
			.limit(1);

		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Find a role by its code
	 */
	async findByCode(code: string): Promise<RoleData | null> {
		const result = await this.db
			.select({
				id: role.id,
				name: role.name,
				code: role.code,
				description: role.description,
				removable: role.removable,
				createdAt: role.createdAt,
				updatedAt: role.updatedAt,
			})
			.from(role)
			.where(eq(role.code, code))
			.limit(1);

		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Get all roles with pagination
	 */
	async findAll(pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>> {
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
				.from(role)
				.limit(limit)
				.offset(offset),
			this.db.select({ count: count() }).from(role),
		]);

		return {
			data,
			total: totalResult[0].count,
			offset,
			limit,
		};
	}

	/**
	 * Create a new role
	 */
	async create(params: CreateRoleParams): Promise<RoleData> {
		const result = await this.db
			.insert(role)
			.values({
				name: params.name,
				code: params.code,
				description: params.description,
			})
			.returning({
				id: role.id,
				name: role.name,
				code: role.code,
				description: role.description,
				removable: role.removable,
				createdAt: role.createdAt,
				updatedAt: role.updatedAt,
			});

		return result[0];
	}

	/**
	 * Update a role's description
	 */
	async update(id: number, params: UpdateRoleParams): Promise<RoleData | null> {
		const result = await this.db
			.update(role)
			.set({
				description: params.description,
				updatedAt: new Date(),
			})
			.where(eq(role.id, id))
			.returning({
				id: role.id,
				name: role.name,
				code: role.code,
				description: role.description,
				removable: role.removable,
				createdAt: role.createdAt,
				updatedAt: role.updatedAt,
			});

		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Delete a role and its permission assignments
	 * Note: user_role entries are deleted via CASCADE
	 */
	async delete(id: number): Promise<void> {
		// Delete role_permission entries first (no CASCADE on this FK)
		await this.db.delete(rolePermission).where(eq(rolePermission.roleId, id));

		// Delete the role
		await this.db.delete(role).where(eq(role.id, id));
	}

	/**
	 * Get all permissions assigned to a role with pagination
	 */
	async getPermissionsForRole(
		roleId: number,
		pagination?: PaginationParams,
	): Promise<PaginatedResponse<PermissionData>> {
		const limit = pagination?.limit ?? DEFAULT_LIMIT;
		const offset = pagination?.offset ?? DEFAULT_OFFSET;

		const [data, totalResult] = await Promise.all([
			this.db
				.select({
					id: permission.id,
					name: permission.name,
					description: permission.description,
					resource: permission.resource,
					action: permission.action,
				})
				.from(rolePermission)
				.innerJoin(permission, eq(rolePermission.permissionId, permission.id))
				.where(eq(rolePermission.roleId, roleId))
				.limit(limit)
				.offset(offset),
			this.db.select({ count: count() }).from(rolePermission).where(eq(rolePermission.roleId, roleId)),
		]);

		return {
			data,
			total: totalResult[0].count,
			offset,
			limit,
		};
	}

	/**
	 * Assign permissions to a role (replaces existing assignments)
	 */
	async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
		// Remove existing permissions
		await this.removeAllPermissions(roleId);

		// Add new permissions
		if (permissionIds.length > 0) {
			const values = permissionIds.map((permissionId) => ({
				roleId,
				permissionId,
			}));

			await this.db.insert(rolePermission).values(values).onConflictDoNothing();
		}
	}

	/**
	 * Remove all permissions from a role
	 */
	async removeAllPermissions(roleId: number): Promise<void> {
		await this.db.delete(rolePermission).where(eq(rolePermission.roleId, roleId));
	}
}
