import { z } from 'zod';
import { roleWithPermissionsSchema } from '../roles/roles.schemas';
import { authUserSchema } from '../users/users.schemas';

// ============================================================================
// Request Schemas
// ============================================================================

export const loginRequestSchema = z.object({
	email: z.string().email('Invalid email format'),
	password: z.string().min(1, 'Password is required'),
});

// ============================================================================
// Response Schemas
// ============================================================================

export const loginResponseSchema = z.object({
	user: authUserSchema,
	token: z.string(),
});

export const refreshResponseSchema = z.object({
	token: z.string(),
});

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
