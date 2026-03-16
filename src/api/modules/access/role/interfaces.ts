import type { PaginatedResponse, PaginationParams } from '../../../interfaces'

// ============================================================================
// Query Parameter Types
// ============================================================================

/**
 * Parameters for listing roles with optional search filtering
 */
export interface ListRolesParams extends PaginationParams {
	search?: string
}

// ============================================================================
// Role Data Types
// ============================================================================

/**
 * Role data returned from the database
 */
export interface RoleData {
	id: number
	name: string
	code: string
	description: string | null
	removable: boolean
	createdAt: Date | null
	updatedAt: Date | null
}

/**
 * Parameters for creating a new role
 */
export interface CreateRoleParams {
	name: string
	code: string
	description?: string
}

/**
 * Parameters for updating a role
 */
export interface UpdateRoleParams {
	name?: string
	description?: string
}

// ============================================================================
// Permission Data Types
// ============================================================================

/**
 * Permission data for role-permission relationships
 */
export interface PermissionData {
	id: number
	name: string
	description: string | null
	resource: string
	action: string
}

/**
 * Role data with nested permissions for introspection responses
 */
export interface RoleWithPermissions {
	id: number
	code: string
	name: string
	description: string | null
	removable: boolean
	createdAt: Date | null
	updatedAt: Date | null
	permissions: PermissionData[]
}

// ============================================================================
// Role Repository & Service Interfaces
// ============================================================================

/**
 * Role repository interface
 */
export interface IRoleRepository {
	findById(id: number): Promise<RoleData | null>
	findByCode(code: string): Promise<RoleData | null>
	findByName(name: string): Promise<RoleData | null>
	findAll(params?: ListRolesParams): Promise<PaginatedResponse<RoleData>>
	create(params: CreateRoleParams): Promise<RoleData>
	update(id: number, params: UpdateRoleParams): Promise<RoleData | null>
	delete(id: number): Promise<void>
	findPermissionsForRole(roleId: number, pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>>
	findPermissionsByIds(ids: number[]): Promise<PermissionData[]>
	assignPermissions(roleId: number, permissionIds: number[]): Promise<void>
	removeAllPermissions(roleId: number): Promise<void>
}

/**
 * Role service interface
 */
export interface IRoleService {
	getRole(id: number): Promise<RoleData | null>
	getRoleByCode(code: string): Promise<RoleData | null>
	getAllRoles(params?: ListRolesParams): Promise<PaginatedResponse<RoleData>>
	createRole(params: CreateRoleParams): Promise<RoleData>
	updateRole(id: number, params: UpdateRoleParams): Promise<RoleData>
	deleteRole(id: number): Promise<void>
	getRolePermissions(roleId: number, pagination?: PaginationParams): Promise<PaginatedResponse<PermissionData>>
	assignPermissionsToRole(roleId: number, permissionIds: number[], userId?: number): Promise<void>
}
