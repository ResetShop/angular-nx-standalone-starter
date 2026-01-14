import type { PaginatedResponse, PaginationParams } from '../../interfaces';
import type { PermissionData, RoleData } from '../role/interfaces';

// Re-export shared interfaces for convenience
export type { PaginatedResponse, PaginationParams };

// ============================================================================
// User Data Types
// ============================================================================

/**
 * User data returned from the database
 */
export interface UserData {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	enabled: boolean;
	deleted: boolean;
}

// ============================================================================
// User Repository Interface
// ============================================================================

/**
 * User repository interface
 */
export interface IUserRepository {
	findByEmail(email: string): Promise<UserData | null>;
	findById(id: number): Promise<UserData | null>;
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
