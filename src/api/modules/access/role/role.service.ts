import type { PaginatedResponse, PaginationParams } from '../../../interfaces';
import type { IUserRoleRepository } from '../../user/interfaces';
import type {
	CreateRoleParams,
	IRoleRepository,
	IRoleService,
	ListRolesParams,
	PermissionData,
	RoleData,
	UpdateRoleParams,
} from './interfaces';
import { ADMIN_ROLE_PERMISSIONS } from './permissions.constants';

export const ROLE_ERRORS = {
	NOT_FOUND: 'Role not found',
	CODE_EXISTS: 'A role with this code already exists',
	NAME_EXISTS: 'A role with this name already exists',
	NOT_REMOVABLE: 'This role cannot be deleted',
	INVALID_PERMISSION_IDS: 'Invalid permission IDs',
	SELF_LOCKOUT: 'Cannot remove role management permission from your own role',
} as const;

/**
 * Error factory functions that include entity IDs for better debugging.
 * The error messages start with the base error constant for easy matching in tests.
 */
export const roleErrors = {
	notFound: (id: number) => new Error(`${ROLE_ERRORS.NOT_FOUND} (id: ${id})`),
	codeExists: (code: string) => new Error(`${ROLE_ERRORS.CODE_EXISTS} (code: ${code})`),
	nameExists: (name: string) => new Error(`${ROLE_ERRORS.NAME_EXISTS} (name: ${name})`),
	notRemovable: (id: number) => new Error(`${ROLE_ERRORS.NOT_REMOVABLE} (id: ${id})`),
};

/**
 * Error thrown when invalid permission IDs are provided
 */
export class InvalidPermissionIdsError extends Error {
	public readonly invalidIds: number[];

	constructor(invalidIds: number[]) {
		super(ROLE_ERRORS.INVALID_PERMISSION_IDS);
		this.name = 'InvalidPermissionIdsError';
		this.invalidIds = invalidIds;
	}
}

/**
 * Error thrown when user attempts to remove role management permission from their own role
 */
export class SelfLockoutError extends Error {
	constructor() {
		super(ROLE_ERRORS.SELF_LOCKOUT);
		this.name = 'SelfLockoutError';
	}
}

interface RoleServiceDeps {
	roleRepository: IRoleRepository;
	userRoleRepository: IUserRoleRepository;
}

/**
 * Service for role management operations.
 * Handles CRUD operations for roles and role-permission assignments.
 * Enforces business rules like unique codes/names and non-removable system roles.
 */
export class RoleService implements IRoleService {
	private roleRepository: IRoleRepository;
	private userRoleRepository: IUserRoleRepository;

	constructor({ roleRepository, userRoleRepository }: RoleServiceDeps) {
		this.roleRepository = roleRepository;
		this.userRoleRepository = userRoleRepository;
	}

	/**
	 * Retrieves a role by its unique identifier.
	 *
	 * @param id - The role's primary key
	 * @returns The role data if found, null otherwise
	 */
	async getRole(id: number): Promise<RoleData | null> {
		return this.roleRepository.findById(id);
	}

	/**
	 * Retrieves a role by its unique code.
	 *
	 * @param code - The role's unique code (e.g., 'admin', 'editor')
	 * @returns The role data if found, null otherwise
	 */
	async getRoleByCode(code: string): Promise<RoleData | null> {
		return this.roleRepository.findByCode(code);
	}

	/**
	 * Retrieves all roles with pagination and optional search filtering.
	 *
	 * @param params - Optional parameters (offset, limit, search)
	 * @returns Paginated response containing roles and metadata
	 */
	async getAllRoles(params?: ListRolesParams): Promise<PaginatedResponse<RoleData>> {
		return this.roleRepository.findAll(params);
	}

	/**
	 * Creates a new role with the specified properties.
	 * Validates that both code and name are unique.
	 *
	 * @param params - Role creation parameters (name, code, description)
	 * @returns The newly created role data
	 * @throws Error if a role with the same code or name already exists
	 */
	async createRole(params: CreateRoleParams): Promise<RoleData> {
		// Check if code already exists
		const existingByCode = await this.roleRepository.findByCode(params.code);
		if (existingByCode) {
			throw roleErrors.codeExists(params.code);
		}

		// Check if name already exists
		const existingByName = await this.roleRepository.findByName(params.name);
		if (existingByName) {
			throw roleErrors.nameExists(params.name);
		}

		return this.roleRepository.create(params);
	}

	/**
	 * Updates an existing role's properties.
	 * Only name and description can be updated; code is immutable.
	 *
	 * @param id - The role's primary key
	 * @param params - Fields to update (name, description)
	 * @returns The updated role data
	 * @throws Error if role not found or new name conflicts with existing role
	 */
	async updateRole(id: number, params: UpdateRoleParams): Promise<RoleData> {
		// Check if role exists
		const existingRole = await this.roleRepository.findById(id);
		if (!existingRole) {
			throw roleErrors.notFound(id);
		}

		// Check if name already exists (if updating name)
		if (params.name !== undefined && params.name !== existingRole.name) {
			const roleWithName = await this.roleRepository.findByName(params.name);
			if (roleWithName) {
				throw roleErrors.nameExists(params.name);
			}
		}

		const updatedRole = await this.roleRepository.update(id, params);

		if (!updatedRole) {
			throw roleErrors.notFound(id);
		}

		return updatedRole;
	}

	/**
	 * Deletes a role and its permission assignments.
	 * System roles (removable=false) cannot be deleted.
	 *
	 * @param id - The role's primary key
	 * @throws Error if role not found or is a non-removable system role
	 */
	async deleteRole(id: number): Promise<void> {
		const existingRole = await this.roleRepository.findById(id);

		if (!existingRole) {
			throw roleErrors.notFound(id);
		}

		if (!existingRole.removable) {
			throw roleErrors.notRemovable(id);
		}

		await this.roleRepository.delete(id);
	}

	/**
	 * Retrieves all permissions assigned to a role with pagination.
	 *
	 * @param roleId - The role's primary key
	 * @param pagination - Optional pagination parameters (offset, limit)
	 * @returns Paginated response containing permissions and metadata
	 * @throws Error if role not found
	 */
	async getRolePermissions(roleId: number, pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>> {
		const existingRole = await this.roleRepository.findById(roleId);

		if (!existingRole) {
			throw roleErrors.notFound(roleId);
		}

		return this.roleRepository.findPermissionsForRole(roleId, pagination);
	}

	/**
	 * Assigns permissions to a role, replacing all existing assignments.
	 * Validates that all permission IDs exist before making changes.
	 * Prevents self-lockout by checking if the user would lose role management permissions.
	 *
	 * @param roleId - The role's primary key
	 * @param permissionIds - Array of permission IDs to assign (replaces existing)
	 * @param userId - Optional user ID for self-lockout prevention check
	 * @throws Error if role not found
	 * @throws InvalidPermissionIdsError if any permission IDs don't exist in database
	 * @throws SelfLockoutError if update would remove user's ability to manage roles
	 */
	async assignPermissionsToRole(roleId: number, permissionIds: number[], userId?: number): Promise<void> {
		const existingRole = await this.roleRepository.findById(roleId);

		if (!existingRole) {
			throw roleErrors.notFound(roleId);
		}

		// Validate permission IDs exist and get permission data
		let foundPermissions: PermissionData[] = [];
		if (permissionIds.length > 0) {
			foundPermissions = await this.roleRepository.findPermissionsByIds(permissionIds);
			const foundIds = new Set(foundPermissions.map((p) => p.id));
			const invalidIds = permissionIds.filter((id) => !foundIds.has(id));

			if (invalidIds.length > 0) {
				throw new InvalidPermissionIdsError(invalidIds);
			}
		}

		// Self-lockout prevention check
		if (userId !== undefined) {
			// Fetch user's current permissions and role assignment in parallel
			const [userPermissions, userHasRole, currentRolePermissions] = await Promise.all([
				this.userRoleRepository.findPermissionsForUser(userId),
				this.userRoleRepository.findUserHasRole(userId, roleId),
				this.roleRepository.findPermissionsForRole(roleId, { limit: 1000 }),
			]);

			// Only need to check for lockout if the user is assigned to the role being modified
			if (userHasRole) {
				const newPermissionsIncludeUpdate = foundPermissions.some((p) => p.name === ADMIN_ROLE_PERMISSIONS.UPDATE);

				if (!newPermissionsIncludeUpdate) {
					// Check if user has UPDATE permission from other roles
					const currentRolePermissionNames = new Set(currentRolePermissions.data.map((p) => p.name));
					const otherRolePermissions = userPermissions.filter((p) => !currentRolePermissionNames.has(p.name));
					const hasUpdateFromOtherRole = otherRolePermissions.some((p) => p.name === ADMIN_ROLE_PERMISSIONS.UPDATE);

					if (!hasUpdateFromOtherRole) {
						throw new SelfLockoutError();
					}
				}
			}
		}

		await this.roleRepository.assignPermissions(roleId, permissionIds);
	}
}
