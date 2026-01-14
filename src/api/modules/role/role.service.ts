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
	NOT_REMOVABLE: 'This role cannot be deleted',
} as const;

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
	 * @throws Error if code already exists
	 */
	async createRole(params: CreateRoleParams): Promise<RoleData> {
		// Check if code already exists
		const existingRole = await this.roleRepository.findByCode(params.code);
		if (existingRole) {
			throw new Error(ROLE_ERRORS.CODE_EXISTS);
		}

		return this.roleRepository.create(params);
	}

	/**
	 * Update a role's description
	 * @throws Error if role not found
	 */
	async updateRole(id: number, params: UpdateRoleParams): Promise<RoleData> {
		const updatedRole = await this.roleRepository.update(id, params);

		if (!updatedRole) {
			throw new Error(ROLE_ERRORS.NOT_FOUND);
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
			throw new Error(ROLE_ERRORS.NOT_FOUND);
		}

		if (!existingRole.removable) {
			throw new Error(ROLE_ERRORS.NOT_REMOVABLE);
		}

		await this.roleRepository.delete(id);
	}

	/**
	 * Get all permissions assigned to a role with pagination
	 */
	async getRolePermissions(roleId: number, pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>> {
		const existingRole = await this.roleRepository.findById(roleId);

		if (!existingRole) {
			throw new Error(ROLE_ERRORS.NOT_FOUND);
		}

		return this.roleRepository.getPermissionsForRole(roleId, pagination);
	}

	/**
	 * Assign permissions to a role (replaces existing assignments)
	 * @throws Error if role not found
	 */
	async assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void> {
		const existingRole = await this.roleRepository.findById(roleId);

		if (!existingRole) {
			throw new Error(ROLE_ERRORS.NOT_FOUND);
		}

		await this.roleRepository.assignPermissions(roleId, permissionIds);
	}
}
