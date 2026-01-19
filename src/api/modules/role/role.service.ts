import type {
	CreateRoleParams,
	IRoleRepository,
	IRoleService,
	PaginatedResponse,
	PaginationParams,
	PermissionData,
	RoleData,
	UpdateRoleParams,
} from './interfaces';

export const ROLE_ERRORS = {
	NOT_FOUND: 'Role not found',
	CODE_EXISTS: 'A role with this code already exists',
	NAME_EXISTS: 'A role with this name already exists',
	NOT_REMOVABLE: 'This role cannot be deleted',
	INVALID_PERMISSION_IDS: 'Invalid permission IDs',
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

interface RoleServiceDeps {
	roleRepository: IRoleRepository;
}

export class RoleService implements IRoleService {
	private roleRepository: IRoleRepository;

	constructor({ roleRepository }: RoleServiceDeps) {
		this.roleRepository = roleRepository;
	}

	/**
	 * Get a role by ID
	 */
	async getRole(id: number): Promise<RoleData | null> {
		return this.roleRepository.findById(id);
	}

	/**
	 * Get a role by code
	 */
	async getRoleByCode(code: string): Promise<RoleData | null> {
		return this.roleRepository.findByCode(code);
	}

	/**
	 * Get all roles with pagination
	 */
	async getAllRoles(pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>> {
		return this.roleRepository.findAll(pagination);
	}

	/**
	 * Create a new role
	 * @throws Error if code or name already exists
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
	 * Update a role
	 * @throws Error if role not found or name already exists
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
	 * Delete a role
	 * @throws Error if role not found or not removable
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
	 * Get all permissions assigned to a role with pagination
	 */
	async getRolePermissions(roleId: number, pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>> {
		const existingRole = await this.roleRepository.findById(roleId);

		if (!existingRole) {
			throw roleErrors.notFound(roleId);
		}

		return this.roleRepository.getPermissionsForRole(roleId, pagination);
	}

	/**
	 * Assign permissions to a role (replaces existing assignments)
	 * @throws Error if role not found
	 * @throws InvalidPermissionIdsError if any permission IDs don't exist
	 */
	async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
		const existingRole = await this.roleRepository.findById(roleId);

		if (!existingRole) {
			throw roleErrors.notFound(roleId);
		}

		// Validate permission IDs exist
		if (permissionIds.length > 0) {
			const foundPermissions = await this.roleRepository.findPermissionsByIds(permissionIds);
			const foundIds = new Set(foundPermissions.map((p) => p.id));
			const invalidIds = permissionIds.filter((id) => !foundIds.has(id));

			if (invalidIds.length > 0) {
				throw new InvalidPermissionIdsError(invalidIds);
			}
		}

		await this.roleRepository.assignPermissions(roleId, permissionIds);
	}
}
