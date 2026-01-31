import type { ErrorResponse, SuccessMessage } from '@contracts/common/error.types';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { PermissionAssignmentError, PermissionData, RoleData } from '@contracts/roles/roles.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { QUERY_DEFAULTS } from '../../constants/query.constants';
import { container } from '../../container';
import { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { ADMIN_ROLE_PERMISSIONS } from './permissions.constants';
import { InvalidPermissionIdsError, ROLE_ERRORS, SelfLockoutError } from './role.service';

const app = new Hono();

/**
 * GET /api/roles
 * Get all roles with pagination and optional search
 */
app.get(
	'/',
	requirePermission(ADMIN_ROLE_PERMISSIONS.READ),
	zValidator(
		'query',
		z.object({
			offset: z.coerce.number().int().min(QUERY_DEFAULTS.OFFSET).optional(),
			limit: z.coerce.number().int().min(QUERY_DEFAULTS.MIN_LIMIT).max(QUERY_DEFAULTS.MAX_LIMIT).optional(),
			search: z.string().trim().min(QUERY_DEFAULTS.SEARCH_MIN_LENGTH).max(QUERY_DEFAULTS.SEARCH_MAX_LENGTH).optional(),
		}),
	),
	async (c) => {
		const { roleService } = container.cradle;
		const { offset, limit, search } = c.req.valid('query');
		const roles = await roleService.getAllRoles({ offset, limit, search });
		return c.json<PaginatedResponse<RoleData>>(roles);
	},
);

/**
 * GET /api/roles/:id
 * Get a role by ID
 */
app.get('/:id', requirePermission(ADMIN_ROLE_PERMISSIONS.READ), async (c) => {
	const { roleService } = container.cradle;
	const id = parseInt(c.req.param('id'), 10);

	if (isNaN(id)) {
		return c.json<ErrorResponse>({ error: 'Invalid role ID' }, 400);
	}

	const role = await roleService.getRole(id);

	if (!role) {
		return c.json<ErrorResponse>({ error: ROLE_ERRORS.NOT_FOUND }, 404);
	}

	return c.json<RoleData>(role);
});

/**
 * POST /api/roles
 * Create a new role
 */
app.post(
	'/',
	requirePermission(ADMIN_ROLE_PERMISSIONS.CREATE),
	zValidator(
		'json',
		z.object({
			name: z.string().min(1).max(100),
			code: z
				.string()
				.min(1)
				.max(50)
				.regex(/^[a-z][a-z0-9_]*$/, 'Code must be lowercase alphanumeric with underscores, starting with a letter'),
			description: z.string().max(500).optional(),
		}),
	),
	async (c) => {
		const { roleService } = container.cradle;
		const body = c.req.valid('json');

		try {
			const role = await roleService.createRole(body);
			return c.json<RoleData>(role, 201);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.startsWith(ROLE_ERRORS.CODE_EXISTS) || error.message.startsWith(ROLE_ERRORS.NAME_EXISTS)) {
					return c.json<ErrorResponse>({ error: error.message }, 409);
				}
			}
			throw error;
		}
	},
);

/**
 * PUT /api/roles/:id
 * Update a role
 */
app.put(
	'/:id',
	requirePermission(ADMIN_ROLE_PERMISSIONS.UPDATE),
	zValidator(
		'json',
		z.object({
			name: z.string().min(1).max(100).optional(),
			description: z.string().max(500).optional(),
		}),
	),
	async (c) => {
		const { roleService } = container.cradle;
		const id = parseInt(c.req.param('id'), 10);

		if (isNaN(id)) {
			return c.json<ErrorResponse>({ error: 'Invalid role ID' }, 400);
		}

		const body = c.req.valid('json');

		try {
			const role = await roleService.updateRole(id, body);
			return c.json<RoleData>(role);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.startsWith(ROLE_ERRORS.NOT_FOUND)) {
					return c.json<ErrorResponse>({ error: error.message }, 404);
				}
				if (error.message.startsWith(ROLE_ERRORS.NAME_EXISTS)) {
					return c.json<ErrorResponse>({ error: error.message }, 409);
				}
			}
			throw error;
		}
	},
);

/**
 * DELETE /api/roles/:id
 * Delete a role
 */
app.delete('/:id', requirePermission(ADMIN_ROLE_PERMISSIONS.DELETE), async (c) => {
	const { roleService } = container.cradle;
	const id = parseInt(c.req.param('id'), 10);

	if (isNaN(id)) {
		return c.json<ErrorResponse>({ error: 'Invalid role ID' }, 400);
	}

	try {
		await roleService.deleteRole(id);
		return c.json<SuccessMessage>({ message: 'Role deleted successfully' });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.startsWith(ROLE_ERRORS.NOT_FOUND)) {
				return c.json<ErrorResponse>({ error: error.message }, 404);
			}
			if (error.message.startsWith(ROLE_ERRORS.NOT_REMOVABLE)) {
				return c.json<ErrorResponse>({ error: error.message }, 403);
			}
		}
		throw error;
	}
});

/**
 * GET /api/roles/:id/permissions
 * Get all permissions assigned to a role with pagination
 */
app.get(
	'/:id/permissions',
	requirePermission(ADMIN_ROLE_PERMISSIONS.READ),
	zValidator(
		'query',
		z.object({
			offset: z.coerce.number().int().min(QUERY_DEFAULTS.OFFSET).optional(),
			limit: z.coerce.number().int().min(QUERY_DEFAULTS.MIN_LIMIT).max(QUERY_DEFAULTS.MAX_LIMIT).optional(),
		}),
	),
	async (c) => {
		const { roleService } = container.cradle;
		const id = parseInt(c.req.param('id'), 10);

		if (isNaN(id)) {
			return c.json<ErrorResponse>({ error: 'Invalid role ID' }, 400);
		}

		const { offset, limit } = c.req.valid('query');

		try {
			const permissions = await roleService.getRolePermissions(id, { offset, limit });
			return c.json<PaginatedResponse<PermissionData>>(permissions);
		} catch (error) {
			if (error instanceof Error && error.message.startsWith(ROLE_ERRORS.NOT_FOUND)) {
				return c.json<ErrorResponse>({ error: error.message }, 404);
			}
			throw error;
		}
	},
);

/**
 * PUT /api/roles/:id/permissions
 * Replace all permissions for a role.
 * This is a full replacement operation - existing permissions are removed
 * and replaced with the provided list.
 */
app.put(
	'/:id/permissions',
	requirePermission(ADMIN_ROLE_PERMISSIONS.UPDATE),
	zValidator(
		'json',
		z.object({
			permissionIds: z.array(z.number().int().positive()),
		}),
	),
	async (c) => {
		const { roleService } = container.cradle;
		const id = parseInt(c.req.param('id'), 10);

		if (isNaN(id)) {
			return c.json<ErrorResponse>({ error: 'Invalid role ID' }, 400);
		}

		const { permissionIds } = c.req.valid('json');
		const userId = Number((c as AuthenticatedContext).user.sub);

		try {
			await roleService.assignPermissionsToRole(id, permissionIds, userId);
			return c.json<SuccessMessage>({ message: 'Permissions assigned successfully' });
		} catch (error) {
			if (error instanceof SelfLockoutError) {
				return c.json<ErrorResponse>({ error: error.message }, 403);
			}
			if (error instanceof InvalidPermissionIdsError) {
				return c.json<PermissionAssignmentError>(
					{ error: error.message, details: { invalidIds: error.invalidIds } },
					400,
				);
			}
			if (error instanceof Error && error.message.startsWith(ROLE_ERRORS.NOT_FOUND)) {
				return c.json<ErrorResponse>({ error: error.message }, 404);
			}
			throw error;
		}
	},
);

export default app;
