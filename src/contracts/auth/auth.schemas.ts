import { z } from 'zod';
import { roleWithPermissionsSchema } from '../roles/roles.schemas';
import { authUserSchema } from '../users/users.schemas';

// ============================================================================
// Request Schemas
// ============================================================================

/**
 * Login request body schema.
 */
export const loginRequestSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Login response schema containing user data and access token.
 */
export const loginResponseSchema = z.object({
	user: authUserSchema,
	token: z.string(),
});

/**
 * Refresh token response schema containing new access token.
 */
export const refreshResponseSchema = z.object({
	token: z.string(),
});

/**
 * Current user (me) response schema with roles and permissions.
 */
export const meResponseSchema = z.object({
	id: z.number(),
	email: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	roles: z.array(roleWithPermissionsSchema),
});

/**
 * Logout response schema.
 */
export const logoutResponseSchema = z.object({
	message: z.string(),
});

/**
 * Token cleanup response schema.
 */
export const cleanupTokensResponseSchema = z.object({
	message: z.string(),
	deletedCount: z.number(),
	incomplete: z.boolean(),
});
