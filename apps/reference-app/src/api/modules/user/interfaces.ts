import type { UserStatus } from '@contracts/user/user.constants'
import type { CreateUserResponse, ResetPasswordResponse } from '@contracts/user/user.types'
import type { DrizzleTransaction } from '../../helpers/drizzle-postgres-connector'
import type { PaginatedResponse, PaginationParams } from '../../interfaces'
import type { PermissionData, RoleData, RoleWithPermissions } from '../access/role/interfaces'

// ============================================================================
// User Data Types
// ============================================================================

/**
 * User data returned from the database
 */
export interface UserData {
	id: number
	email: string
	firstName: string
	lastName: string
	status: UserStatus
}

/**
 * Extended user data with timestamps for management responses
 */
export interface UserWithTimestamps extends UserData {
	statusChangedAt: Date | null
	statusChangedBy: number | null
	deletedAt: Date | null
	createdAt: Date | null
	updatedAt: Date | null
}

/**
 * Managed user data with roles array for user management responses
 */
export interface ManagedUserData extends UserWithTimestamps {
	roles: RoleData[]
}

/**
 * Parameters for creating a new user.
 * Password is auto-generated server-side and sent via welcome email.
 */
export interface CreateUserParams {
	email: string
	firstName: string
	lastName: string
	/** Role IDs to assign. Defaults to no roles when omitted. */
	roleIds?: number[]
	/** Whether the user must change their password on first login. Defaults to true. */
	mustChangePassword?: boolean
}

/**
 * Parameters for updating an existing user
 */
export interface UpdateUserParams {
	email?: string
	firstName?: string
	lastName?: string
}

/**
 * Parameters for updating a user's account status
 */
export interface UpdateUserStatusParams {
	status: UserStatus
	changedBy: number
}

// ============================================================================
// User Repository Interface
// ============================================================================

/**
 * User repository interface
 */
export interface UserRepository {
	findByEmail(email: string): Promise<UserData | null>
	findById(id: number): Promise<UserData | null>
}

/**
 * Identity-only parameters for inserting a user row.
 * The initial credential is written separately via the auth domain
 * (AuthenticationRepository.createInitialPassword), composed in one transaction.
 */
export interface CreateUserRepoParams {
	email: string
	firstName: string
	lastName: string
	roleIds: number[]
}

/**
 * User management repository interface for CRUD operations
 */
export interface UserManagementRepository {
	findAll(pagination?: PaginationParams, search?: string): Promise<PaginatedResponse<ManagedUserData>>
	findByIdWithRoles(id: number): Promise<ManagedUserData | null>
	findByEmail(email: string): Promise<UserData | null>
	create(params: CreateUserRepoParams, actorId: number, tx?: DrizzleTransaction): Promise<ManagedUserData>
	update(id: number, params: UpdateUserParams, actorId: number): Promise<UserData | null>
	updateStatus(id: number, params: UpdateUserStatusParams): Promise<ManagedUserData | null>
	softDelete(id: number, changedBy: number): Promise<boolean>
	/**
	 * Runs a callback inside a transaction, exposing the transaction handle so the
	 * service can compose the user insert and the auth-row insert atomically.
	 */
	runInTransaction<T>(fn: (tx: DrizzleTransaction) => Promise<T>): Promise<T>
}

// ============================================================================
// User Role Data Types
// ============================================================================

/**
 * User role assignment data
 */
export interface UserRoleAssignment {
	userId: number
	roleId: number
	createdAt: Date | null
}

/**
 * Parameters for assigning a role to a user
 */
export interface AssignRoleParams {
	roleId: number
}

// ============================================================================
// User Role Repository & Service Interfaces
// ============================================================================

/**
 * User role repository interface
 */
export interface UserRoleRepository {
	/**
	 * Find all roles assigned to a user with pagination
	 */
	findRolesForUser(userId: number, pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>>

	/**
	 * Find all roles assigned to a user with their permissions nested
	 */
	findRolesWithPermissionsForUser(userId: number): Promise<RoleWithPermissions[]>

	/**
	 * Find all permissions for a user (aggregated from all their roles)
	 */
	findPermissionsForUser(userId: number): Promise<PermissionData[]>

	/**
	 * Assign a role to a user
	 * @returns true if role was assigned, false if already assigned
	 */
	assignRoleToUser(userId: number, roleId: number, actorId: number): Promise<boolean>

	/**
	 * Remove a role from a user
	 */
	removeRoleFromUser(userId: number, roleId: number, actorId: number): Promise<boolean>

	/**
	 * Check if a user has a specific role
	 */
	findUserHasRole(userId: number, roleId: number): Promise<boolean>

	/**
	 * Replace all role assignments for a user
	 * @throws Error if any role ID does not exist
	 */
	replaceUserRoles(userId: number, roleIds: number[], actorId: number): Promise<void>
}

/**
 * User role service interface
 */
export interface UserRoleService {
	/**
	 * Get all roles for a user with pagination
	 */
	getUserRoles(userId: number, pagination?: PaginationParams): Promise<PaginatedResponse<RoleData>>

	/**
	 * Get all roles for a user with their permissions nested
	 */
	getUserRolesWithPermissions(userId: number): Promise<RoleWithPermissions[]>

	/**
	 * Get all permissions for a user (aggregated from all their roles)
	 */
	getUserPermissions(userId: number): Promise<PermissionData[]>

	/**
	 * Assign a role to a user
	 * @throws Error if user or role not found, or already assigned
	 */
	assignRoleToUser(userId: number, roleId: number, actorId: number): Promise<void>

	/**
	 * Remove a role from a user
	 * @throws Error if user not found or role not assigned
	 */
	removeRoleFromUser(userId: number, roleId: number, actorId: number): Promise<void>

	/**
	 * Replace all role assignments for a user
	 * @throws Error if user not found or any role ID does not exist
	 */
	replaceUserRoles(userId: number, roleIds: number[], actorId: number): Promise<void>
}

/**
 * User management service interface for CRUD operations
 */
export interface UserManagementService {
	getAllUsers(pagination?: PaginationParams, search?: string): Promise<PaginatedResponse<ManagedUserData>>
	getUser(id: number): Promise<ManagedUserData>
	createUser(params: CreateUserParams, actorId: number): Promise<CreateUserResponse>
	updateUser(id: number, params: UpdateUserParams, actorId: number): Promise<ManagedUserData>
	updateUserStatus(id: number, params: UpdateUserStatusParams): Promise<ManagedUserData>
	deleteUser(id: number, currentUserId: number): Promise<void>
	resetPassword(id: number, currentUserId: number): Promise<ResetPasswordResponse>
}
