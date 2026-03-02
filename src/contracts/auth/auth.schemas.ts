import { z } from 'zod';
import { QUERY_DEFAULTS } from '../common/query.constants';
import { roleWithPermissionsSchema } from '../role/role.schemas';
import { authUserSchema } from '../user/user.schemas';

// ============================================================================
// Request Schemas
// ============================================================================

export const loginRequestSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(QUERY_DEFAULTS.FIELD_MIN_LENGTH, 'Password is required'),
});

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Schema for authentication error responses.
 * Maps to the AuthErrorResponse interface from auth.errors.ts.
 *
 * Named "auth" (not "login") because it represents the system's authentication
 * interaction with the user, not the specific login action.
 * See auth.md § Naming: "login" = user action, "auth" = system interaction.
 */
export const authErrorResponseSchema = z.object({
	code: z.string(),
	message: z.string(),
});

export const loginResponseSchema = z.object({
	user: authUserSchema,
	mustChangePassword: z.boolean(),
});

export const refreshResponseSchema = z.object({});

export const meResponseSchema = z.object({
	id: z.number(),
	email: z.string(),
	firstName: z.string(),
	lastName: z.string(),
	roles: z.array(roleWithPermissionsSchema),
});

export const logoutResponseSchema = z.object({
	message: z.string(),
});

export const cleanupTokensResponseSchema = z.object({
	message: z.string(),
	deletedCount: z.number(),
	incomplete: z.boolean(),
});
