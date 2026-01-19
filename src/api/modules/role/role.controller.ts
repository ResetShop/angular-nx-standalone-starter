import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { container } from '../../container';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { ADMIN_ROLE_PERMISSIONS } from './permissions.constants';
import { InvalidPermissionIdsError, ROLE_ERRORS } from './role.service';

const app = new Hono();

/**
 * GET /api/roles
 * Get all roles with pagination
 */
app.get(
	'/',
	requirePermission(ADMIN_ROLE_PERMISSIONS.READ),
	zValidator(
		'query',
		z.object({
			offset: z.coerce.number().int().min(0).optional(),
			limit: z.coerce.number().int().min(1).max(100).optional(),
		}),
	),
	async (c) => {
		const { roleService } = container.cradle;
		const { offset, limit } = c.req.valid('query');
		const roles = await roleService.getAllRoles({ offset, limit });
		return c.json(roles);
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
		return c.json({ error: 'Invalid role ID' }, 400);
	}

	const role = await roleService.getRole(id);

	if (!role) {
		return c.json({ error: ROLE_ERRORS.NOT_FOUND }, 404);
	}

	return c.json(role);
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
			return c.json(role, 201);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === ROLE_ERRORS.CODE_EXISTS || error.message === ROLE_ERRORS.NAME_EXISTS) {
					return c.json({ error: error.message }, 409);
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
			return c.json({ error: 'Invalid role ID' }, 400);
		}

		const body = c.req.valid('json');

		try {
			const role = await roleService.updateRole(id, body);
			return c.json(role);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === ROLE_ERRORS.NOT_FOUND) {
					return c.json({ error: error.message }, 404);
				}
				if (error.message === ROLE_ERRORS.NAME_EXISTS) {
					return c.json({ error: error.message }, 409);
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
		return c.json({ error: 'Invalid role ID' }, 400);
	}

	try {
		await roleService.deleteRole(id);
		return c.json({ message: 'Role deleted successfully' });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === ROLE_ERRORS.NOT_FOUND) {
				return c.json({ error: error.message }, 404);
			}
			if (error.message === ROLE_ERRORS.NOT_REMOVABLE) {
				return c.json({ error: error.message }, 403);
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
			offset: z.coerce.number().int().min(0).optional(),
			limit: z.coerce.number().int().min(1).max(100).optional(),
		}),
	),
	async (c) => {
		const { roleService } = container.cradle;
		const id = parseInt(c.req.param('id'), 10);

		if (isNaN(id)) {
			return c.json({ error: 'Invalid role ID' }, 400);
		}

		const { offset, limit } = c.req.valid('query');

		try {
			const permissions = await roleService.getRolePermissions(id, { offset, limit });
			return c.json(permissions);
		} catch (error) {
			if (error instanceof Error && error.message === ROLE_ERRORS.NOT_FOUND) {
				return c.json({ error: error.message }, 404);
			}
			throw error;
		}
	},
);

/**
 * POST /api/roles/:id/permissions
 * Assign permissions to a role (replaces existing)
 */
app.post(
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
			return c.json({ error: 'Invalid role ID' }, 400);
		}

		const { permissionIds } = c.req.valid('json');

		try {
			await roleService.assignPermissionsToRole(id, permissionIds);
			return c.json({ message: 'Permissions assigned successfully' });
		} catch (error) {
			if (error instanceof InvalidPermissionIdsError) {
				return c.json({ error: error.message, invalidIds: error.invalidIds }, 400);
			}
			if (error instanceof Error && error.message === ROLE_ERRORS.NOT_FOUND) {
				return c.json({ error: error.message }, 404);
			}
			throw error;
		}
	},
);

export default app;
