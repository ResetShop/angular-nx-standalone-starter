import type { z } from 'zod';
import type {
	assignPermissionsRequestSchema,
	createRoleRequestSchema,
	permissionAssignmentErrorSchema,
	permissionDataSchema,
	roleDataSchema,
	roleWithPermissionsSchema,
	updateRoleRequestSchema,
} from './roles.schemas';

// ============================================================================
// Permission Types
// ============================================================================

/**
 * Permission data type for role-permission relationships.
 */
export type PermissionData = z.infer<typeof permissionDataSchema>;

// ============================================================================
// Role Types
// ============================================================================

/**
 * Role data type returned from the database.
 */
export type RoleData = z.infer<typeof roleDataSchema>;

/**
 * Role with nested permissions type for introspection responses.
 */
export type RoleWithPermissions = z.infer<typeof roleWithPermissionsSchema>;

// ============================================================================
// Request Types
// ============================================================================

/**
 * Create role request body type.
 */
export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>;

/**
 * Update role request body type.
 */
export type UpdateRoleRequest = z.infer<typeof updateRoleRequestSchema>;

/**
 * Assign permissions request body type.
 */
export type AssignPermissionsRequest = z.infer<typeof assignPermissionsRequestSchema>;

// ============================================================================
// Response Types
// ============================================================================

/**
 * Error response with invalid permission IDs details.
 */
export type PermissionAssignmentError = z.infer<typeof permissionAssignmentErrorSchema>;
