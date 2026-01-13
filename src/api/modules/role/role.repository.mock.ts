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

export class MockRoleRepository implements IRoleRepository {
	private roles: Map<number, RoleData> = new Map();
	private rolesByCode: Map<string, RoleData> = new Map();
	private rolePermissions: Map<number, PermissionData[]> = new Map();
	private nextId = 1;

	/**
	 * Add a role to the mock repository for testing.
	 */
	addRole(role: RoleData): void {
		this.roles.set(role.id, role);
		this.rolesByCode.set(role.code, role);
	}

	/**
	 * Add permissions for a role.
	 */
	addPermissionsForRole(roleId: number, permissions: PermissionData[]): void {
		this.rolePermissions.set(roleId, permissions);
	}

	/**
	 * Clear all data from the mock repository.
	 */
	clear(): void {
		this.roles.clear();
		this.rolesByCode.clear();
		this.rolePermissions.clear();
		this.nextId = 1;
	}

	async findById(id: number): Promise<RoleData | null> {
		return this.roles.get(id) ?? null;
	}

	async findByCode(code: string): Promise<RoleData | null> {
		return this.rolesByCode.get(code) ?? null;
	}

	async findAll(pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>> {
		const limit = pagination?.limit ?? DEFAULT_LIMIT;
		const offset = pagination?.offset ?? DEFAULT_OFFSET;

		const allRoles = Array.from(this.roles.values());
		const data = allRoles.slice(offset, offset + limit);

		return {
			data,
			total: allRoles.length,
			offset,
			limit,
		};
	}

	async create(params: CreateRoleParams): Promise<RoleData> {
		const now = new Date();
		const role: RoleData = {
			id: this.nextId++,
			name: params.name,
			code: params.code,
			description: params.description ?? null,
			removable: true,
			createdAt: now,
			updatedAt: now,
		};

		this.roles.set(role.id, role);
		this.rolesByCode.set(role.code, role);

		return role;
	}

	async update(id: number, params: UpdateRoleParams): Promise<RoleData | null> {
		const existing = this.roles.get(id);
		if (!existing) {
			return null;
		}

		const updated: RoleData = {
			...existing,
			description: params.description,
			updatedAt: new Date(),
		};

		this.roles.set(id, updated);
		this.rolesByCode.set(updated.code, updated);

		return updated;
	}

	async delete(id: number): Promise<void> {
		const role = this.roles.get(id);
		if (role) {
			this.roles.delete(id);
			this.rolesByCode.delete(role.code);
			this.rolePermissions.delete(id);
		}
	}

	async getPermissionsForRole(
		roleId: number,
		pagination?: PaginationParams,
	): Promise<PaginatedResponse<PermissionData>> {
		const limit = pagination?.limit ?? DEFAULT_LIMIT;
		const offset = pagination?.offset ?? DEFAULT_OFFSET;

		const allPermissions = this.rolePermissions.get(roleId) ?? [];
		const data = allPermissions.slice(offset, offset + limit);

		return {
			data,
			total: allPermissions.length,
			offset,
			limit,
		};
	}

	async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
		// Create mock permissions from IDs
		const permissions: PermissionData[] = permissionIds.map((id) => ({
			id,
			name: `permission_${id}`,
			description: `Permission ${id}`,
			resource: 'resource',
			action: 'action',
		}));

		this.rolePermissions.set(roleId, permissions);
	}

	async removeAllPermissions(roleId: number): Promise<void> {
		this.rolePermissions.delete(roleId);
	}
}
