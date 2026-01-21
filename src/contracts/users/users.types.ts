import type { z } from 'zod';
import type { assignRoleToUserRequestSchema, authUserSchema, userDataSchema } from './users.schemas';

// ============================================================================
// User Data Types
// ============================================================================

/**
 * Full user data type returned from the database.
 */
export type UserData = z.infer<typeof userDataSchema>;

/**
 * Auth user type (subset of user data for authentication responses).
 */
export type AuthUser = z.infer<typeof authUserSchema>;

// ============================================================================
// User Role Request Types
// ============================================================================

/**
 * Assign role to user request body type.
 */
export type AssignRoleToUserRequest = z.infer<typeof assignRoleToUserRequestSchema>;
