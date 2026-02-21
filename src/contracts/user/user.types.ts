import type { z } from 'zod';
import type {
	assignRoleToUserRequestSchema,
	authUserSchema,
	createUserRequestSchema,
	managedUserSchema,
	updateUserRequestSchema,
	userDataSchema,
} from './user.schemas';

// ============================================================================
// User Data Types
// ============================================================================

export type UserData = z.infer<typeof userDataSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;

// ============================================================================
// Managed User Types (User Management API)
// ============================================================================

export type ManagedUser = z.infer<typeof managedUserSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;

// ============================================================================
// User Role Request Types
// ============================================================================

export type AssignRoleToUserRequest = z.infer<typeof assignRoleToUserRequestSchema>;
