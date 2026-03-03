import type { ErrorResponse, SuccessMessage } from '@contracts/common/error.types';
import type { PaginatedResponse } from '@contracts/common/pagination.types';
import { updateUserStatusRequestSchema } from '@contracts/user/user.schemas';
import type {
	CreateUserRequest,
	CreateUserResponse,
	ManagedUser,
	UpdateUserRequest,
	UpdateUserStatusRequest,
} from '@contracts/user/user.types';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { container } from '../../container/container';
import type { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { createOpenAPIApp, registerRoute } from '../../openapi-app';
import { ADMIN_USER_PERMISSIONS } from '../access/role/permissions.constants';
import {
	createUserRoute,
	deleteUserRoute,
	getUserRoute,
	listUsersRoute,
	updateUserRoute,
} from './user-management.routes';
import { USER_MANAGEMENT_ERRORS } from './user-management.service';

const ERROR_STATUS_MAP = [
	[USER_MANAGEMENT_ERRORS.NOT_FOUND, 404],
	[USER_MANAGEMENT_ERRORS.EMAIL_EXISTS, 409],
	[USER_MANAGEMENT_ERRORS.SELF_LOCKOUT, 403],
	[USER_MANAGEMENT_ERRORS.INVALID_TRANSITION, 422],
] as const;

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

const app = createOpenAPIApp();

/**
 * GET /api/user
 * List users with pagination and optional search
 */
registerRoute(app, listUsersRoute, async (c) => {
	const { userManagementService } = container.cradle;
	const { offset, limit, search } = c.req.valid('query');

	const users = await userManagementService.getAllUsers({ offset, limit }, search);
	return c.json<PaginatedResponse<ManagedUser>>(users);
});

/**
 * GET /api/user/:id
 * Get user details with roles
 */
registerRoute(app, getUserRoute, async (c) => {
	const { userManagementService } = container.cradle;
	const id = Number(c.req.param('id'));

	try {
		const userData = await userManagementService.getUser(id);
		return c.json<ManagedUser>(userData);
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.NOT_FOUND)) {
			return c.json<ErrorResponse>({ error: error.message }, 404);
		}
		throw error;
	}
});

/**
 * POST /api/user
 * Create a new user with optional role assignments
 */
registerRoute(app, createUserRoute, async (c) => {
	const { userManagementService } = container.cradle;
	const body: CreateUserRequest = c.req.valid('json');

	try {
		const result = await userManagementService.createUser(body);
		return c.json<CreateUserResponse>(result, 201);
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS)) {
			return c.json<ErrorResponse>({ error: error.message }, 409);
		}
		throw error;
	}
});

/**
 * PATCH /api/user/:id
 * Update user details, roles, or status
 */
registerRoute(app, updateUserRoute, async (c) => {
	const { userManagementService } = container.cradle;
	const id = Number(c.req.param('id'));
	const body: UpdateUserRequest = c.req.valid('json');
	const currentUserId = Number((c as AuthenticatedContext).user?.sub);

	try {
		const userData = await userManagementService.updateUser(id, body, currentUserId);
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
});

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
registerRoute(app, deleteUserRoute, async (c) => {
	const { userManagementService } = container.cradle;
	const id = Number(c.req.param('id'));
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
});

export default app;
