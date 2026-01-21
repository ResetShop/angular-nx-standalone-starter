import type { z } from 'zod';
import type { assignRoleToUserRequestSchema, authUserSchema, userDataSchema } from './users.schemas';

// ============================================================================
// User Data Types
// ============================================================================

export type UserData = z.infer<typeof userDataSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;

// ============================================================================
// User Role Request Types
// ============================================================================

export type AssignRoleToUserRequest = z.infer<typeof assignRoleToUserRequestSchema>;
