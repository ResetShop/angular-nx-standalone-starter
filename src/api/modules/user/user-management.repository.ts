import { and, count, eq, ilike, inArray, or } from 'drizzle-orm';
import { authentication } from '../../../db/schema/authentication';
import { role } from '../../../db/schema/role';
import { user, userRole } from '../../../db/schema/user';
import { QUERY_DEFAULTS } from '../../constants/query.constants';
import { BaseRepository } from '../../helpers/base.repository';
import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { RoleData } from '../access/role/interfaces';
import type { IUserManagementRepository, ManagedUserData, UserData } from './interfaces';

interface UserProjection {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	enabled: boolean | null;
	deleted: boolean | null;
	createdAt: Date | null;
	updatedAt: Date | null;
}

interface RoleAssignmentProjection {
	userId: number;
	roleId: number;
	roleName: string;
	roleCode: string;
	roleDescription: string | null;
	roleRemovable: boolean;
	roleCreatedAt: Date | null;
	roleUpdatedAt: Date | null;
}

/**
 * Repository for user management CRUD operations.
 * Handles user listing, creation, updates, and soft deletion.
 */
export class UserManagementRepository extends BaseRepository implements IUserManagementRepository {
	/**
	 * Retrieves all non-deleted users with pagination and optional search.
	 * Each user includes their assigned roles.
	 *
	 * @param pagination - Optional pagination parameters (offset, limit)
	 * @param search - Optional search term to filter by email, first name, or last name
	 * @returns Paginated response containing users with roles
	 */
	async findAll(pagination?: PaginationParams, search?: string): Promise<PaginatedResponse<ManagedUserData>> {
		const limit = pagination?.limit ?? QUERY_DEFAULTS.LIMIT;
		const offset = pagination?.offset ?? QUERY_DEFAULTS.OFFSET;

		const baseCondition = eq(user.deleted, false);

		const whereClause = search
			? and(
					baseCondition,
					or(
						ilike(user.email, `%${search}%`),
						ilike(user.firstName, `%${search}%`),
						ilike(user.lastName, `%${search}%`),
					),
				)
			: baseCondition;

		const [users, totalResult] = await Promise.all([
			this.db
				.select({
					id: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					enabled: user.enabled,
					deleted: user.deleted,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt,
				})
				.from(user)
				.where(whereClause)
				.limit(limit)
				.offset(offset),
			this.db.select({ count: count() }).from(user).where(whereClause),
		]);

		const usersWithRoles = await this.attachRolesToUsers(users);

		return {
			data: usersWithRoles,
			total: totalResult[0].count,
			offset,
			limit,
		};
	}

	/**
	 * Finds a user by ID with their assigned roles.
	 * Returns null if not found or if the user is deleted.
	 *
	 * @param id - The user's primary key
	 * @returns User data with roles, or null if not found
	 */
	async findByIdWithRoles(id: number): Promise<ManagedUserData | null> {
		const result = await this.db
			.select({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				enabled: user.enabled,
				deleted: user.deleted,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			})
			.from(user)
			.where(and(eq(user.id, id), eq(user.deleted, false)))
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		const usersWithRoles = await this.attachRolesToUsers(result);
		return usersWithRoles[0];
	}

	/**
	 * Finds a non-deleted user by email.
	 *
	 * @param email - Email address to search for
	 * @returns User data if found, null otherwise
	 */
	async findByEmail(email: string): Promise<UserData | null> {
		const result = await this.db
			.select({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				enabled: user.enabled,
				deleted: user.deleted,
			})
			.from(user)
			.where(and(eq(user.email, email), eq(user.deleted, false)))
			.limit(1);

		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Creates a new user and their authentication record in a single transaction.
	 * The user record stores profile data, the authentication record stores the password hash.
	 *
	 * @param params - User creation parameters including password hash
	 * @returns The newly created user data
	 */
	async create(params: {
		email: string;
		firstName: string;
		lastName: string;
		passwordHash: string;
	}): Promise<UserData> {
		return this.db.transaction(async (tx) => {
			const userResult = await tx
				.insert(user)
				.values({
					email: params.email,
					firstName: params.firstName,
					lastName: params.lastName,
				})
				.returning({
					id: user.id,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					enabled: user.enabled,
					deleted: user.deleted,
				});

			const newUser = userResult[0];

			await tx.insert(authentication).values({
				userId: newUser.id,
				passwordHash: params.passwordHash,
			});

			return newUser;
		});
	}

	/**
	 * Updates an existing user's properties.
	 * Only provided fields are updated.
	 *
	 * @param id - The user's primary key
	 * @param params - Fields to update
	 * @returns Updated user data, or null if not found
	 */
	async update(
		id: number,
		params: { email?: string; firstName?: string; lastName?: string; enabled?: boolean },
	): Promise<UserData | null> {
		const updateData: Partial<typeof user.$inferInsert> = { updatedAt: new Date() };

		if (params.email !== undefined) {
			updateData.email = params.email;
		}
		if (params.firstName !== undefined) {
			updateData.firstName = params.firstName;
		}
		if (params.lastName !== undefined) {
			updateData.lastName = params.lastName;
		}
		if (params.enabled !== undefined) {
			updateData.enabled = params.enabled;
		}

		const result = await this.db
			.update(user)
			.set(updateData)
			.where(and(eq(user.id, id), eq(user.deleted, false)))
			.returning({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				enabled: user.enabled,
				deleted: user.deleted,
			});

		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Soft deletes a user by setting deleted=true and enabled=false.
	 *
	 * @param id - The user's primary key
	 * @returns true if the user was deleted, false if not found
	 */
	async softDelete(id: number): Promise<boolean> {
		const result = await this.db
			.update(user)
			.set({ deleted: true, enabled: false, updatedAt: new Date() })
			.where(and(eq(user.id, id), eq(user.deleted, false)))
			.returning({ id: user.id });

		return result.length > 0;
	}

	/**
	 * Replaces all role assignments for a user.
	 * Removes existing roles and assigns the new ones in a transaction.
	 *
	 * @param userId - The user's primary key
	 * @param roleIds - Array of role IDs to assign (replaces existing)
	 */
	async replaceUserRoles(userId: number, roleIds: number[]): Promise<void> {
		await this.db.transaction(async (tx) => {
			await tx.delete(userRole).where(eq(userRole.userId, userId));

			if (roleIds.length > 0) {
				const values = roleIds.map((roleId) => ({ userId, roleId }));
				await tx.insert(userRole).values(values).onConflictDoNothing();
			}
		});
	}

	/**
	 * Attaches roles to an array of user records.
	 * Fetches all role assignments in a single query for efficiency.
	 */
	private async attachRolesToUsers(users: UserProjection[]): Promise<ManagedUserData[]> {
		if (users.length === 0) {
			return [];
		}

		const userIds = users.map((u) => u.id);

		const roleAssignments = await this.db
			.select({
				userId: userRole.userId,
				roleId: role.id,
				roleName: role.name,
				roleCode: role.code,
				roleDescription: role.description,
				roleRemovable: role.removable,
				roleCreatedAt: role.createdAt,
				roleUpdatedAt: role.updatedAt,
			})
			.from(userRole)
			.innerJoin(role, eq(userRole.roleId, role.id))
			.where(inArray(userRole.userId, userIds));

		const rolesByUserId = this.groupRolesByUserId(roleAssignments);

		return users.map((u) => ({
			...u,
			enabled: u.enabled ?? true,
			deleted: u.deleted ?? false,
			roles: rolesByUserId.get(u.id) ?? [],
		}));
	}

	/**
	 * Groups role assignment rows into a map keyed by user ID.
	 */
	private groupRolesByUserId(roleAssignments: RoleAssignmentProjection[]): Map<number, RoleData[]> {
		const rolesByUserId = new Map<number, RoleData[]>();
		for (const ra of roleAssignments) {
			const roles = rolesByUserId.get(ra.userId) ?? [];
			roles.push({
				id: ra.roleId,
				name: ra.roleName,
				code: ra.roleCode,
				description: ra.roleDescription,
				removable: ra.roleRemovable,
				createdAt: ra.roleCreatedAt,
				updatedAt: ra.roleUpdatedAt,
			});
			rolesByUserId.set(ra.userId, roles);
		}
		return rolesByUserId;
	}
}
