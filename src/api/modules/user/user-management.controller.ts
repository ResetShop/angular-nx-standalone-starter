import type { ErrorResponse, SuccessMessage } from '@contracts/common/error.types';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { ManagedUser } from '@contracts/users/users.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { PAGINATION_DEFAULTS } from '../../constants/pagination.constants';
import { container } from '../../container';
import type { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { ADMIN_USER_PERMISSIONS } from '../role/permissions.constants';
import { USER_MANAGEMENT_ERRORS } from './user-management.service';

const app = new Hono();

/**
 * GET /api/users
 * List users with pagination and optional search
 */
app.get(
	'/',
	requirePermission(ADMIN_USER_PERMISSIONS.READ),
	zValidator(
		'query',
		z.object({
			offset: z.coerce.number().int().min(PAGINATION_DEFAULTS.OFFSET).optional(),
			limit: z.coerce.number().int().min(PAGINATION_DEFAULTS.MIN_LIMIT).max(PAGINATION_DEFAULTS.MAX_LIMIT).optional(),
			search: z.string().optional(),
		}),
	),
	async (c) => {
		const { userManagementService } = container.cradle;
		const { offset, limit, search } = c.req.valid('query');

		const users = await userManagementService.list({ offset, limit }, search);
		return c.json<PaginatedResponse<ManagedUser>>(users);
	},
);

/**
 * GET /api/users/:id
 * Get user details with roles
 */
app.get('/:id', requirePermission(ADMIN_USER_PERMISSIONS.READ), async (c) => {
	const { userManagementService } = container.cradle;
	const id = parseInt(c.req.param('id'), 10);

	if (isNaN(id)) {
		return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
	}

	try {
		const userData = await userManagementService.getById(id);
		return c.json<ManagedUser>(userData);
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.NOT_FOUND)) {
			return c.json<ErrorResponse>({ error: error.message }, 404);
		}
		throw error;
	}
});

/**
 * POST /api/users
 * Create a new user with optional role assignments
 */
app.post(
	'/',
	requirePermission(ADMIN_USER_PERMISSIONS.CREATE),
	zValidator(
		'json',
		z.object({
			email: z.string().email(),
			password: z.string().min(8).max(128),
			firstName: z.string().min(1).max(100),
			lastName: z.string().min(1).max(100),
			roleIds: z.array(z.number().int().positive()).optional(),
		}),
	),
	async (c) => {
		const { userManagementService } = container.cradle;
		const body = c.req.valid('json');

		try {
			const userData = await userManagementService.create(body);
			return c.json<ManagedUser>(userData, 201);
		} catch (error) {
			if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS)) {
				return c.json<ErrorResponse>({ error: error.message }, 409);
			}
			throw error;
		}
	},
);

/**
 * PATCH /api/users/:id
 * Update user details, roles, or status
 */
app.patch(
	'/:id',
	requirePermission(ADMIN_USER_PERMISSIONS.UPDATE),
	zValidator(
		'json',
		z.object({
			email: z.string().email().optional(),
			firstName: z.string().min(1).max(100).optional(),
			lastName: z.string().min(1).max(100).optional(),
			enabled: z.boolean().optional(),
			roleIds: z.array(z.number().int().positive()).optional(),
		}),
	),
	async (c) => {
		const { userManagementService } = container.cradle;
		const id = parseInt(c.req.param('id'), 10);

		if (isNaN(id)) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}

		const body = c.req.valid('json');
		const currentUserId = Number((c as AuthenticatedContext).user?.sub);

		try {
			const userData = await userManagementService.update(id, body, currentUserId);
			return c.json<ManagedUser>(userData);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message.startsWith(USER_MANAGEMENT_ERRORS.NOT_FOUND)) {
					return c.json<ErrorResponse>({ error: error.message }, 404);
				}
				if (error.message.startsWith(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS)) {
					return c.json<ErrorResponse>({ error: error.message }, 409);
				}
				if (error.message.startsWith(USER_MANAGEMENT_ERRORS.SELF_DISABLE)) {
					return c.json<ErrorResponse>({ error: error.message }, 403);
				}
			}
			throw error;
		}
	},
);

/**
 * DELETE /api/users/:id
 * Soft delete a user
 */
app.delete('/:id', requirePermission(ADMIN_USER_PERMISSIONS.DELETE), async (c) => {
	const { userManagementService } = container.cradle;
	const id = parseInt(c.req.param('id'), 10);

	if (isNaN(id)) {
		return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
	}

	try {
		await userManagementService.delete(id);
		return c.json<SuccessMessage>({ message: 'User deleted successfully' });
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.NOT_FOUND)) {
			return c.json<ErrorResponse>({ error: error.message }, 404);
		}
		throw error;
	}
});

export default app;
