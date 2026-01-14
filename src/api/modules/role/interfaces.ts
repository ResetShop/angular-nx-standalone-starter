/**
 * Role data returned from the database
 */
export interface RoleData {
	id: number;
	name: string;
	code: string;
	description: string | null;
	removable: boolean;
	createdAt: Date | null;
	updatedAt: Date | null;
}

/**
 * Parameters for creating a new role
 */
export interface CreateRoleParams {
	name: string;
	code: string;
	description?: string;
}

/**
 * Parameters for updating a role
 */
export interface UpdateRoleParams {
	name?: string;
	description?: string;
}

/**
 * Permission data for role-permission relationships
 */
export interface PermissionData {
	id: number;
	name: string;
	description: string | null;
	resource: string;
	action: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
	offset?: number;
	limit?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	offset: number;
	limit: number;
}

/**
 * Role repository interface
 */
export interface IRoleRepository {
	findById(id: number): Promise<RoleData | null>;
	findByCode(code: string): Promise<RoleData | null>;
	findByName(name: string): Promise<RoleData | null>;
	findAll(pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>>;
	create(params: CreateRoleParams): Promise<RoleData>;
	update(id: number, params: UpdateRoleParams): Promise<RoleData | null>;
	delete(id: number): Promise<void>;
	getPermissionsForRole(roleId: number, pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>>;
	assignPermissions(roleId: number, permissionIds: number[]): Promise<void>;
	removeAllPermissions(roleId: number): Promise<void>;
}

/**
 * Role service interface
 */
export interface IRoleService {
	getRole(id: number): Promise<RoleData | null>;
	getRoleByCode(code: string): Promise<RoleData | null>;
	getAllRoles(pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>>;
	createRole(params: CreateRoleParams): Promise<RoleData>;
	updateRole(id: number, params: UpdateRoleParams): Promise<RoleData>;
	deleteRole(id: number): Promise<void>;
	getRolePermissions(roleId: number, pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>>;
	assignPermissionsToRole(roleId: number, permissionIds: number[]): Promise<void>;
}
