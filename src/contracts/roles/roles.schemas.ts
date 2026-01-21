import { z } from 'zod';

// ============================================================================
// Permission Schemas
// ============================================================================

/**
 * Permission data schema for role-permission relationships.
 */
export const permissionDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable(),
	resource: z.string(),
	action: z.string(),
});

// ============================================================================
// Role Schemas
// ============================================================================

/**
 * Role data schema returned from the database.
 */
export const roleDataSchema = z.object({
	id: z.number(),
	name: z.string(),
	code: z.string(),
	description: z.string().nullable(),
	removable: z.boolean(),
	createdAt: z.coerce.date().nullable(),
	updatedAt: z.coerce.date().nullable(),
});

/**
 * Role with nested permissions schema for introspection responses.
 */
export const roleWithPermissionsSchema = z.object({
	id: z.number(),
	code: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	permissions: z.array(permissionDataSchema),
});

// ============================================================================
// Request Schemas
// ============================================================================

export const createRoleRequestSchema = z.object({
	name: z.string().min(1),
	code: z.string().min(1),
	description: z.string().optional(),
});

export const updateRoleRequestSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().optional(),
});

export const assignPermissionsRequestSchema = z.object({
	permissionIds: z.array(z.number()),
});

// ============================================================================
// Response Schemas
// ============================================================================

/**
 * Error response with invalid permission IDs details.
 */
export const permissionAssignmentErrorSchema = z.object({
	error: z.string(),
	details: z
		.object({
			invalidIds: z.array(z.number()),
		})
		.optional(),
});
