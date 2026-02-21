import type { ErrorResponse, SuccessMessage } from '@contracts/common/error.types';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { PermissionData, RoleData } from '@contracts/role/role.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { QUERY_DEFAULTS } from '../../constants/query.constants';
import { container } from '../../container';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { ADMIN_USER_ROLE_PERMISSIONS } from '../access/role/permissions.constants';
import { USER_ROLE_ERRORS } from './user-role.service';

const app = new Hono();

/**
 * GET /api/user/:userId/roles
 * Get all roles assigned to a user with pagination
 */
app.get(
	'/:userId/roles',
	requirePermission(ADMIN_USER_ROLE_PERMISSIONS.READ),
	zValidator(
		'query',
		z.object({
			offset: z.coerce.number().int().min(QUERY_DEFAULTS.OFFSET).optional(),
			limit: z.coerce.number().int().min(QUERY_DEFAULTS.MIN_LIMIT).max(QUERY_DEFAULTS.MAX_LIMIT).optional(),
		}),
	),
	async (c) => {
		const { userRoleService } = container.cradle;
		const userId = parseInt(c.req.param('userId'), 10);

		if (isNaN(userId)) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}

		const { offset, limit } = c.req.valid('query');

		try {
			const roles = await userRoleService.getUserRoles(userId, { offset, limit });
			return c.json<PaginatedResponse<RoleData>>(roles);
		} catch (error) {
			if (error instanceof Error && error.message.startsWith(USER_ROLE_ERRORS.USER_NOT_FOUND)) {
				return c.json<ErrorResponse>({ error: error.message }, 404);
			}
			throw error;
		}
	},
);

/**
 * GET /api/user/:userId/permissions
 * Get all permissions for a user (aggregated from all their roles)
 */
app.get('/:userId/permissions', requirePermission(ADMIN_USER_ROLE_PERMISSIONS.READ), async (c) => {
	const { userRoleService } = container.cradle;
	const userId = parseInt(c.req.param('userId'), 10);

	if (isNaN(userId)) {
		return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
	}

	try {
		const permissions = await userRoleService.getUserPermissions(userId);
		return c.json<PermissionData[]>(permissions);
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(USER_ROLE_ERRORS.USER_NOT_FOUND)) {
			return c.json<ErrorResponse>({ error: error.message }, 404);
		}
		throw error;
	}
});

/**
 * POST /api/user/:userId/roles
 * Assign a role to a user
 */
app.post(
	'/:userId/roles',
	requirePermission(ADMIN_USER_ROLE_PERMISSIONS.ASSIGN),
	zValidator(
		'json',
		z.object({
			roleId: z.number().int().positive(),
		}),
	),
	async (c) => {
		const { userRoleService } = container.cradle;
		const userId = parseInt(c.req.param('userId'), 10);

		if (isNaN(userId)) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}

		const { roleId } = c.req.valid('json');

		try {
			await userRoleService.assignRoleToUser(userId, roleId);
			return c.json<SuccessMessage>({ message: 'Role assigned successfully' }, 201);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.startsWith(USER_ROLE_ERRORS.USER_NOT_FOUND)) {
					return c.json<ErrorResponse>({ error: error.message }, 404);
				}
				if (error.message.startsWith(USER_ROLE_ERRORS.ROLE_NOT_FOUND)) {
					return c.json<ErrorResponse>({ error: error.message }, 404);
				}
				if (error.message.startsWith(USER_ROLE_ERRORS.ROLE_ALREADY_ASSIGNED)) {
					return c.json<ErrorResponse>({ error: error.message }, 409);
				}
			}
			throw error;
		}
	},
);

/**
 * PUT /api/user/:userId/roles
 * Replace all role assignments for a user
 */
app.put(
	'/:userId/roles',
	requirePermission(ADMIN_USER_ROLE_PERMISSIONS.ASSIGN),
	zValidator(
		'json',
		z.object({
			roleIds: z.array(z.number().int().positive()),
		}),
	),
	async (c) => {
		const { userRoleService } = container.cradle;
		const userId = parseInt(c.req.param('userId'), 10);

		if (isNaN(userId)) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}

		const { roleIds } = c.req.valid('json');

		try {
			await userRoleService.replaceUserRoles(userId, roleIds);
			return c.json<SuccessMessage>({ message: 'Roles replaced successfully' }, 200);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.startsWith(USER_ROLE_ERRORS.USER_NOT_FOUND)) {
					return c.json<ErrorResponse>({ error: error.message }, 404);
				}
				if (error.message.startsWith(USER_ROLE_ERRORS.ROLES_NOT_FOUND)) {
					return c.json<ErrorResponse>({ error: error.message }, 400);
				}
			}
			throw error;
		}
	},
);

/**
 * DELETE /api/user/:userId/roles/:roleId
 * Remove a role from a user
 */
app.delete('/:userId/roles/:roleId', requirePermission(ADMIN_USER_ROLE_PERMISSIONS.REMOVE), async (c) => {
	const { userRoleService } = container.cradle;
	const userId = parseInt(c.req.param('userId'), 10);
	const roleId = parseInt(c.req.param('roleId'), 10);

	if (isNaN(userId)) {
		return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
	}

	if (isNaN(roleId)) {
		return c.json<ErrorResponse>({ error: 'Invalid role ID' }, 400);
	}

	try {
		await userRoleService.removeRoleFromUser(userId, roleId);
		return c.json<SuccessMessage>({ message: 'Role removed successfully' });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message.startsWith(USER_ROLE_ERRORS.USER_NOT_FOUND)) {
				return c.json<ErrorResponse>({ error: error.message }, 404);
			}
			if (error.message.startsWith(USER_ROLE_ERRORS.ROLE_NOT_ASSIGNED)) {
				return c.json<ErrorResponse>({ error: error.message }, 404);
			}
		}
		throw error;
	}
});

export default app;
