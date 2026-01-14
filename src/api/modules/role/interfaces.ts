import type { PaginatedResponse, PaginationParams } from '../../interfaces';

// Re-export shared interfaces for convenience
export type { PaginatedResponse, PaginationParams };

// ============================================================================
// Role Data Types
// ============================================================================

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

// ============================================================================
// Permission Data Types
// ============================================================================

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

// ============================================================================
// Role Repository & Service Interfaces
// ============================================================================

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

// ============================================================================
// User Role Data Types
// ============================================================================

/**
 * User role assignment data
 */
export interface UserRoleAssignment {
	userId: number;
	roleId: number;
	createdAt: Date | null;
}

/**
 * Parameters for assigning a role to a user
 */
export interface AssignRoleParams {
	roleId: number;
}

// ============================================================================
// User Role Repository & Service Interfaces
// ============================================================================

/**
 * User role repository interface
 */
export interface IUserRoleRepository {
	/**
	 * Get all roles assigned to a user with pagination
	 */
	getUserRoles(userId: number, pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>>;

	/**
	 * Get all permissions for a user (aggregated from all their roles)
	 */
	getUserPermissions(userId: number): Promise<PermissionData[]>;

	/**
	 * Assign a role to a user
	 * @throws Error if assignment already exists
	 */
	assignRoleToUser(userId: number, roleId: number): Promise<void>;

	/**
	 * Remove a role from a user
	 */
	removeRoleFromUser(userId: number, roleId: number): Promise<boolean>;

	/**
	 * Check if a user has a specific role
	 */
	userHasRole(userId: number, roleId: number): Promise<boolean>;
}

/**
 * User role service interface
 */
export interface IUserRoleService {
	/**
	 * Get all roles for a user with pagination
	 */
	getUserRoles(userId: number, pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>>;

	/**
	 * Get all permissions for a user (aggregated from all their roles)
	 */
	getUserPermissions(userId: number): Promise<PermissionData[]>;

	/**
	 * Assign a role to a user
	 * @throws Error if user or role not found, or already assigned
	 */
	assignRoleToUser(userId: number, roleId: number): Promise<void>;

	/**
	 * Remove a role from a user
	 * @throws Error if user not found or role not assigned
	 */
	removeRoleFromUser(userId: number, roleId: number): Promise<void>;
}
