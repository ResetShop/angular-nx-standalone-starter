import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { IRoleRepository, PermissionData, RoleData, RoleWithPermissions } from '../access/role/interfaces';
import type { IUserRepository, IUserRoleRepository, IUserRoleService } from './interfaces';
import { userRoleErrors } from './user-role.errors';

interface UserRoleServiceDeps {
	userRoleRepository: IUserRoleRepository;
	userRepository: IUserRepository;
	roleRepository: IRoleRepository;
}

/**
 * Service for managing user-role assignments.
 * Handles role assignment, removal, and permission aggregation for users.
 * Validates entity existence before performing operations.
 */
export class UserRoleService implements IUserRoleService {
	private userRoleRepository: IUserRoleRepository;
	private userRepository: IUserRepository;
	private roleRepository: IRoleRepository;

	constructor({ userRoleRepository, userRepository, roleRepository }: UserRoleServiceDeps) {
		this.userRoleRepository = userRoleRepository;
		this.userRepository = userRepository;
		this.roleRepository = roleRepository;
	}

	/**
	 * Retrieves all roles assigned to a user with pagination.
	 *
	 * @param userId - The user's primary key
	 * @param pagination - Optional pagination parameters (offset, limit)
	 * @returns Paginated response containing roles and metadata
	 * @throws Error if user not found
	 */
	async getUserRoles(userId: number, pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>> {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw userRoleErrors.userNotFound(userId);
		}

		return this.userRoleRepository.findRolesForUser(userId, pagination);
	}

	/**
	 * Retrieves all roles for a user with their permissions nested.
	 * Each role includes its full permission list.
	 *
	 * @param userId - The user's primary key
	 * @returns Array of roles with nested permissions (empty if user has no roles)
	 */
	async getUserRolesWithPermissions(userId: number): Promise<RoleWithPermissions[]> {
		return this.userRoleRepository.findRolesWithPermissionsForUser(userId);
	}

	/**
	 * Retrieves all permissions for a user aggregated from all their assigned roles.
	 * Returns distinct permissions to avoid duplicates when multiple roles share permissions.
	 *
	 * @param userId - The user's primary key
	 * @returns Array of unique permissions across all user's roles
	 * @throws Error if user not found
	 */
	async getUserPermissions(userId: number): Promise<PermissionData[]> {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw userRoleErrors.userNotFound(userId);
		}

		return this.userRoleRepository.findPermissionsForUser(userId);
	}

	/**
	 * Assigns a role to a user.
	 * Validates that both user and role exist before assignment.
	 * Prevents duplicate role assignments.
	 *
	 * @param userId - The user's primary key
	 * @param roleId - The role's primary key to assign
	 * @throws Error if user not found
	 * @throws Error if role not found
	 * @throws Error if role is already assigned to the user
	 */
	async assignRoleToUser(userId: number, roleId: number): Promise<void> {
		// Verify user exists
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw userRoleErrors.userNotFound(userId);
		}

		// Verify role exists
		const role = await this.roleRepository.findById(roleId);
		if (!role) {
			throw userRoleErrors.roleNotFound(roleId);
		}

		// Attempt to assign role - database constraint handles duplicates atomically
		const assigned = await this.userRoleRepository.assignRoleToUser(userId, roleId);
		if (!assigned) {
			throw userRoleErrors.roleAlreadyAssigned(userId, roleId);
		}
	}

	/**
	 * Removes a role assignment from a user.
	 * Validates that the user exists before attempting removal.
	 *
	 * @param userId - The user's primary key
	 * @param roleId - The role's primary key to remove
	 * @throws Error if user not found
	 * @throws Error if role is not assigned to the user
	 */
	async removeRoleFromUser(userId: number, roleId: number): Promise<void> {
		// Verify user exists
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw userRoleErrors.userNotFound(userId);
		}

		const removed = await this.userRoleRepository.removeRoleFromUser(userId, roleId);
		if (!removed) {
			throw userRoleErrors.roleNotAssigned(userId, roleId);
		}
	}

	/**
	 * Replaces all role assignments for a user.
	 * Validates that the user exists before delegating to the repository,
	 * which validates role existence and performs the swap in a single transaction.
	 *
	 * @param userId - The user's primary key
	 * @param roleIds - Array of role IDs to assign (replaces all existing)
	 * @throws Error if user not found
	 * @throws Error if any role ID does not exist
	 */
	async replaceUserRoles(userId: number, roleIds: number[]): Promise<void> {
		const user = await this.userRepository.findById(userId);
		if (!user) {
			throw userRoleErrors.userNotFound(userId);
		}

		await this.userRoleRepository.replaceUserRoles(userId, roleIds);
	}
}
