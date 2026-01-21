import { z } from 'zod';

// ============================================================================
// User Data Schemas
// ============================================================================

/**
 * Full user data schema returned from the database.
 */
export const userDataSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	firstName: z.string(),
	lastName: z.string(),
	enabled: z.boolean(),
	deleted: z.boolean(),
});

/**
 * Auth user schema (subset of user data for authentication responses).
 * Excludes the `deleted` field which is internal.
 */
export const authUserSchema = z.object({
	id: z.number(),
	email: z.string().email(),
	firstName: z.string(),
	lastName: z.string(),
	enabled: z.boolean(),
});

// ============================================================================
// User Role Request Schemas
// ============================================================================

/**
 * Assign role to user request body schema.
 */
export const assignRoleToUserRequestSchema = z.object({
	roleId: z.number(),
});
