import { z } from 'zod';
import { QUERY_DEFAULTS } from '../common/query.constants';
import { roleDataSchema } from '../role/role.schemas';

// ============================================================================
// User Data Schemas
// ============================================================================

/**
 * Full user data schema returned from the database.
 */
export const userDataSchema = z.object({
	id: z.number(),
	email: z.email(),
	firstName: z.string(),
	lastName: z.string(),
	enabled: z.boolean(),
	deleted: z.boolean(),
});

/**
 * Auth user schema (subset of user data for authentication responses).
 * Excludes `enabled` and `deleted` fields which are internal.
 */
export const authUserSchema = z.object({
	id: z.number(),
	email: z.email(),
	firstName: z.string(),
	lastName: z.string(),
});

// ============================================================================
// Managed User Schemas (User Management API)
// ============================================================================

/**
 * Managed user schema with roles array for user management responses.
 * Includes user data with their assigned roles.
 */
export const managedUserSchema = z.object({
	id: z.number(),
	email: z.email(),
	firstName: z.string(),
	lastName: z.string(),
	enabled: z.boolean(),
	deleted: z.boolean(),
	createdAt: z.coerce.date().nullable(),
	updatedAt: z.coerce.date().nullable(),
	roles: z.array(roleDataSchema),
});

// ============================================================================
// User Management Request Schemas
// ============================================================================

/**
 * Create user request body schema.
 * Requires email, first/last name, and optional role IDs.
 * Password is auto-generated server-side and sent via welcome email.
 */
export const createUserRequestSchema = z.object({
	email: z.email(),
	firstName: z.string().min(1).max(100),
	lastName: z.string().min(1).max(100),
	roleIds: z.array(z.number().int().positive()).optional(),
	mustChangePassword: z.boolean().optional().default(true),
});

/**
 * Create user response schema.
 * Extends managed user with a flag indicating whether the welcome email was sent.
 */
export const createUserResponseSchema = managedUserSchema.extend({
	passwordEmailSent: z.boolean(),
});

/**
 * Update user request body schema.
 * All fields are optional - only provided fields are updated.
 */
export const updateUserRequestSchema = z.object({
	email: z.email().optional(),
	firstName: z.string().min(1).max(100).optional(),
	lastName: z.string().min(1).max(100).optional(),
	enabled: z.boolean().optional(),
	roleIds: z.array(z.number().int().positive()).optional(),
});

// ============================================================================
// User Role Request Schemas
// ============================================================================

/**
 * Assign role to user request body schema.
 */
export const assignRoleToUserRequestSchema = z.object({
	roleId: z.number().int().positive(),
});

/**
 * Replace all role assignments for a user request body schema.
 */
export const replaceUserRolesRequestSchema = z.object({
	roleIds: z
		.array(z.number().int().positive())
		.max(QUERY_DEFAULTS.MAX_ROLE_IDS_PER_REQUEST)
		.refine((ids) => new Set(ids).size === ids.length, 'roleIds must be unique'),
});
