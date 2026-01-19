import type { IRoleRepository, PermissionData, RoleData } from '../role/interfaces';
import type {
	IUserRepository,
	IUserRoleRepository,
	IUserRoleService,
	PaginatedResponse,
	PaginationParams,
} from './interfaces';

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
	 * Get all roles for a user with pagination
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
	 * Get all permissions for a user (aggregated from all their roles)
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
	 * Assign a role to a user
	 * @throws Error if user or role not found, or role already assigned
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

		// Check if role is already assigned
		const hasRole = await this.userRoleRepository.userHasRole(userId, roleId);
		if (hasRole) {
			throw userRoleErrors.roleAlreadyAssigned(userId, roleId);
		}

		await this.userRoleRepository.assignRoleToUser(userId, roleId);
	}

	/**
	 * Remove a role from a user
	 * @throws Error if user not found or role not assigned
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
