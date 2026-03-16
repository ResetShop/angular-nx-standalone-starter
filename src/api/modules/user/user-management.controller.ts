import type { ErrorResponse, SuccessMessage } from '@contracts/common/error.types'
import type { PaginatedResponse } from '@contracts/common/pagination.types'
import type {
	CreateUserRequest,
	CreateUserResponse,
	ManagedUser,
	UpdateUserRequest,
	UpdateUserStatusRequest,
} from '@contracts/user/user.types'
import { container } from '../../container/container'
import type { AuthenticatedContext } from '../../middlewares/verify-access-token.middleware'
import { createOpenAPIApp, registerRoute } from '../../openapi-app'
import {
	createUserRoute,
	deleteUserRoute,
	getUserRoute,
	listUsersRoute,
	updateUserRoute,
	updateUserStatusRoute,
} from './user-management.routes'
import { USER_MANAGEMENT_ERRORS } from './user-management.service'

const ERROR_STATUS_MAP = [
	[USER_MANAGEMENT_ERRORS.NOT_FOUND, 404],
	[USER_MANAGEMENT_ERRORS.EMAIL_EXISTS, 409],
	[USER_MANAGEMENT_ERRORS.SELF_LOCKOUT, 403],
	[USER_MANAGEMENT_ERRORS.INVALID_TRANSITION, 422],
] as const

function resolveErrorStatus(error: unknown): { message: string; status: 403 | 404 | 409 | 422 } | null {
	if (!(error instanceof Error)) return null
	for (const [prefix, status] of ERROR_STATUS_MAP) {
		if (error.message.startsWith(prefix)) return { message: error.message, status }
	}
	return null
}

const app = createOpenAPIApp()

/**
 * GET /api/user
 * List users with pagination and optional search
 */
registerRoute(app, listUsersRoute, async (c) => {
	const { userManagementService } = container.cradle
	// TODO: Replace inline type with SearchPaginationParams once defined in contracts (prototype branch)
	const { offset, limit, search }: { offset?: number; limit?: number; search?: string } = c.req.valid('query')

	const users = await userManagementService.getAllUsers({ offset, limit }, search)
	return c.json<PaginatedResponse<ManagedUser>>(users)
})

/**
 * GET /api/user/:id
 * Get user details with roles
 */
registerRoute(app, getUserRoute, async (c) => {
	const { userManagementService } = container.cradle
	const { id }: { id: number } = c.req.valid('param')

	try {
		const userData = await userManagementService.getUser(id)
		return c.json<ManagedUser>(userData)
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.NOT_FOUND)) {
			return c.json<ErrorResponse>({ error: error.message }, 404)
		}
		throw error
	}
})

/**
 * POST /api/user
 * Create a new user with optional role assignments
 */
registerRoute(app, createUserRoute, async (c) => {
	const { userManagementService } = container.cradle
	const body: CreateUserRequest = c.req.valid('json')

	try {
		const result = await userManagementService.createUser(body)
		return c.json<CreateUserResponse>(result, 201)
	} catch (error) {
		if (error instanceof Error && error.message.startsWith(USER_MANAGEMENT_ERRORS.EMAIL_EXISTS)) {
			return c.json<ErrorResponse>({ error: error.message }, 409)
		}
		throw error
	}
})

/**
 * PATCH /api/user/:id
 * Update user details or role assignments
 */
registerRoute(app, updateUserRoute, async (c) => {
	const { userManagementService } = container.cradle
	const { id }: { id: number } = c.req.valid('param')
	const body: UpdateUserRequest = c.req.valid('json')

	try {
		const userData = await userManagementService.updateUser(id, body)
		return c.json<ManagedUser>(userData)
	} catch (error) {
		const mapped = resolveErrorStatus(error)
		if (mapped) return c.json<ErrorResponse>({ error: mapped.message }, mapped.status)
		throw error
	}
})

/**
 * PATCH /api/user/:id/status
 * Update user account status (state machine enforcement)
 */
registerRoute(app, updateUserStatusRoute, async (c) => {
	const { userManagementService } = container.cradle
	const { id }: { id: number } = c.req.valid('param')
	const body: UpdateUserStatusRequest = c.req.valid('json')
	const currentUserId = Number((c as AuthenticatedContext).user.sub)

	try {
		const userData = await userManagementService.updateUserStatus(id, {
			status: body.status,
			changedBy: currentUserId,
		})
		return c.json<ManagedUser>(userData)
	} catch (error) {
		const mapped = resolveErrorStatus(error)
		if (mapped) return c.json<ErrorResponse>({ error: mapped.message }, mapped.status)
		throw error
	}
})

/**
 * DELETE /api/user/:id
 * Soft delete a user
 */
registerRoute(app, deleteUserRoute, async (c) => {
	const { userManagementService } = container.cradle
	const { id }: { id: number } = c.req.valid('param')
	const currentUserId = Number((c as AuthenticatedContext).user.sub)

	try {
		await userManagementService.deleteUser(id, currentUserId)
		return c.json<SuccessMessage>({ message: 'User deleted successfully' })
	} catch (error) {
		const mapped = resolveErrorStatus(error)
		if (mapped) return c.json<ErrorResponse>({ error: mapped.message }, mapped.status)
		throw error
	}
})

export default app
