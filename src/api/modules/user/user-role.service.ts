import { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { IRoleRepository, PermissionData, RoleData, RoleWithPermissions } from '../access/role/interfaces';
import type { IUserRepository, IUserRoleRepository, IUserRoleService } from './interfaces';

export const USER_ROLE_ERRORS = {
	USER_NOT_FOUND: 'User not found',
	ROLE_NOT_FOUND: 'Role not found',
	ROLE_ALREADY_ASSIGNED: 'Role is already assigned to this user',
	ROLE_NOT_ASSIGNED: 'Role is not assigned to this user',
} as const;

/**
 * Error factory functions that include entity IDs for better debugging.
 * The error messages start with the base error constant for easy matching in tests.
 */
export const userRoleErrors = {
	userNotFound: (userId: number) => new Error(`${USER_ROLE_ERRORS.USER_NOT_FOUND} (userId: ${userId})`),
	roleNotFound: (roleId: number) => new Error(`${USER_ROLE_ERRORS.ROLE_NOT_FOUND} (roleId: ${roleId})`),
	roleAlreadyAssigned: (userId: number, roleId: number) =>
		new Error(`${USER_ROLE_ERRORS.ROLE_ALREADY_ASSIGNED} (userId: ${userId}, roleId: ${roleId})`),
	roleNotAssigned: (userId: number, roleId: number) =>
		new Error(`${USER_ROLE_ERRORS.ROLE_NOT_ASSIGNED} (userId: ${userId}, roleId: ${roleId})`),
};

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

		return this.userRoleRepository.getUserRoles(userId, pagination);
	}

	/**
	 * Retrieves all roles for a user with their permissions nested.
	 * Each role includes its full permission list.
	 *
	 * @param userId - The user's primary key
	 * @returns Array of roles with nested permissions (empty if user has no roles)
	 */
	async getUserRolesWithPermissions(userId: number): Promise<RoleWithPermissions[]> {
		return this.userRoleRepository.getUserRolesWithPermissions(userId);
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

		return this.userRoleRepository.getUserPermissions(userId);
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
}
