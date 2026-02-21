import type { ErrorResponse, SuccessMessage } from '@contracts/common/error.types';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import type { ManagedUser } from '@contracts/user/user.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { QUERY_DEFAULTS } from '../../constants/query.constants';
import { container } from '../../container';
import type { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { ADMIN_USER_PERMISSIONS } from '../access/role/permissions.constants';
import { USER_MANAGEMENT_ERRORS } from './user-management.service';

const ERROR_STATUS_MAP = [
	[USER_MANAGEMENT_ERRORS.NOT_FOUND, 404],
	[USER_MANAGEMENT_ERRORS.EMAIL_EXISTS, 409],
	[USER_MANAGEMENT_ERRORS.SELF_DISABLE, 403],
] as const;

const app = new Hono();

/**
 * GET /api/user
 * List users with pagination and optional search
 */
app.get(
	'/',
	requirePermission(ADMIN_USER_PERMISSIONS.READ),
	zValidator(
		'query',
		z.object({
			offset: z.coerce.number().int().min(QUERY_DEFAULTS.OFFSET).optional(),
			limit: z.coerce.number().int().min(QUERY_DEFAULTS.MIN_LIMIT).max(QUERY_DEFAULTS.MAX_LIMIT).optional(),
			search: z.string().trim().min(QUERY_DEFAULTS.SEARCH_MIN_LENGTH).max(QUERY_DEFAULTS.SEARCH_MAX_LENGTH).optional(),
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
 * GET /api/user/:id
 * Get user details with roles
 */
app.get(
	'/:id',
	requirePermission(ADMIN_USER_PERMISSIONS.READ),
	zValidator('param', z.object({ id: z.coerce.number().int().positive() }), (result, c) => {
		if (!result.success) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}
	}),
	async (c) => {
		const { userManagementService } = container.cradle;
		const { id } = c.req.valid('param');

		try {
			const userData = await userManagementService.getById(id);
			return c.json<ManagedUser>(userData);
		} catch (error) {
			if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.NOT_FOUND)) {
				return c.json<ErrorResponse>({ error: error.message }, 404);
			}
			throw error;
		}
	},
);

/**
 * POST /api/user
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
 * PATCH /api/user/:id
 * Update user details, roles, or status
 */
app.patch(
	'/:id',
	requirePermission(ADMIN_USER_PERMISSIONS.UPDATE),
	zValidator('param', z.object({ id: z.coerce.number().int().positive() }), (result, c) => {
		if (!result.success) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}
	}),
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
		const { id } = c.req.valid('param');
		const body = c.req.valid('json');
		const currentUserId = Number((c as AuthenticatedContext).user?.sub);

		try {
			const userData = await userManagementService.update(id, body, currentUserId);
			return c.json<ManagedUser>(userData);
		} catch (error) {
			if (error instanceof Error) {
				for (const [prefix, status] of ERROR_STATUS_MAP) {
					if (error.message.startsWith(prefix)) {
						return c.json<ErrorResponse>({ error: error.message }, status);
					}
				}
			}
			throw error;
		}
	},
);

/**
 * DELETE /api/user/:id
 * Soft delete a user
 */
app.delete(
	'/:id',
	requirePermission(ADMIN_USER_PERMISSIONS.DELETE),
	zValidator('param', z.object({ id: z.coerce.number().int().positive() }), (result, c) => {
		if (!result.success) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}
	}),
	async (c) => {
		const { userManagementService } = container.cradle;
		const { id } = c.req.valid('param');

		try {
			await userManagementService.delete(id);
			return c.json<SuccessMessage>({ message: 'User deleted successfully' });
		} catch (error) {
			if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.NOT_FOUND)) {
				return c.json<ErrorResponse>({ error: error.message }, 404);
			}
			throw error;
		}
	},
);

export default app;
