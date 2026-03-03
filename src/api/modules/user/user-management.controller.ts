import type { ErrorResponse, SuccessMessage } from '@contracts/common/error.types';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import {
	createUserRequestSchema,
	updateUserRequestSchema,
	updateUserStatusRequestSchema,
} from '@contracts/user/user.schemas';
import type { CreateUserResponse, ManagedUser, UpdateUserStatusRequest } from '@contracts/user/user.types';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { QUERY_DEFAULTS } from '../../constants/query.constants';
import { container } from '../../container/container';
import type { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { ADMIN_USER_PERMISSIONS } from '../access/role/permissions.constants';
import { USER_MANAGEMENT_ERRORS } from './user-management.service';

const ERROR_STATUS_MAP = [
	[USER_MANAGEMENT_ERRORS.NOT_FOUND, 404],
	[USER_MANAGEMENT_ERRORS.EMAIL_EXISTS, 409],
	[USER_MANAGEMENT_ERRORS.SELF_LOCKOUT, 403],
	[USER_MANAGEMENT_ERRORS.INVALID_TRANSITION, 422],
] as const;

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

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

		const users = await userManagementService.getAllUsers({ offset, limit }, search);
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
	zValidator('param', idParamSchema, (result, c) => {
		if (!result.success) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}
	}),
	async (c) => {
		const { userManagementService } = container.cradle;
		const { id } = c.req.valid('param');

		try {
			const userData = await userManagementService.getUser(id);
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
	zValidator('json', createUserRequestSchema),
	async (c) => {
		const { userManagementService } = container.cradle;
		const body = c.req.valid('json');

		try {
			const result = await userManagementService.createUser(body);
			return c.json<CreateUserResponse>(result, 201);
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
	zValidator('param', idParamSchema, (result, c) => {
		if (!result.success) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}
	}),
	zValidator('json', updateUserRequestSchema),
	async (c) => {
		const { userManagementService } = container.cradle;
		const { id } = c.req.valid('param');
		const body = c.req.valid('json');

		try {
			const userData = await userManagementService.updateUser(id, body);
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
 * PATCH /api/user/:id/status
 * Update user account status (state machine enforcement)
 */
app.patch(
	'/:id/status',
	requirePermission(ADMIN_USER_PERMISSIONS.DISABLE),
	zValidator('param', idParamSchema, (result, c) => {
		if (!result.success) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}
	}),
	zValidator('json', updateUserStatusRequestSchema),
	async (c) => {
		const { userManagementService } = container.cradle;
		const { id } = c.req.valid('param');
		const body: UpdateUserStatusRequest = c.req.valid('json');
		const currentUserId = Number((c as AuthenticatedContext).user?.sub);

		try {
			const userData = await userManagementService.updateUserStatus(
				id,
				{ status: body.status, changedBy: currentUserId },
				currentUserId,
			);
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
	zValidator('param', idParamSchema, (result, c) => {
		if (!result.success) {
			return c.json<ErrorResponse>({ error: 'Invalid user ID' }, 400);
		}
	}),
	async (c) => {
		const { userManagementService } = container.cradle;
		const { id } = c.req.valid('param');
		const currentUserId = Number((c as AuthenticatedContext).user?.sub);

		try {
			await userManagementService.deleteUser(id, currentUserId);
			return c.json<SuccessMessage>({ message: 'User deleted successfully' });
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

export default app;
