import { errorResponseSchema, successMessageSchema } from '@contracts/common/error.schemas';
import { paginatedResponseSchema, searchPaginationSchema } from '@contracts/common/pagination.schemas';
import {
	createUserRequestSchema,
	createUserResponseSchema,
	managedUserSchema,
	updateUserRequestSchema,
} from '@contracts/user/user.schemas';
import { createRoute } from '@hono/zod-openapi';
import { requirePermission } from '../../middlewares/verify-permissions.middleware';
import { commonSecuredResponses, idParamSchema } from '../../openapi-config';
import { ADMIN_USER_PERMISSIONS } from '../access/role/permissions.constants';

export const listUsersRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Users'],
	summary: 'List users',
	description: 'List users with pagination and optional search.',
	middleware: [requirePermission(ADMIN_USER_PERMISSIONS.READ)] as const,
	request: { query: searchPaginationSchema },
	responses: {
		200: {
			description: 'Paginated list of users',
			content: { 'application/json': { schema: paginatedResponseSchema(managedUserSchema) } },
		},
		...commonSecuredResponses,
	},
});

export const getUserRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Users'],
	summary: 'Get user by ID',
	description: 'Get user details with roles.',
	middleware: [requirePermission(ADMIN_USER_PERMISSIONS.READ)] as const,
	request: { params: idParamSchema },
	responses: {
		200: {
			description: 'User details',
			content: { 'application/json': { schema: managedUserSchema } },
		},
		400: {
			description: 'Invalid user ID',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		404: {
			description: 'User not found',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		...commonSecuredResponses,
	},
});

export const createUserRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Users'],
	summary: 'Create a user',
	description: 'Create a new user with optional role assignments.',
	middleware: [requirePermission(ADMIN_USER_PERMISSIONS.CREATE)] as const,
	request: {
		body: {
			content: { 'application/json': { schema: createUserRequestSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			description: 'User created',
			content: { 'application/json': { schema: createUserResponseSchema } },
		},
		409: {
			description: 'Email already exists',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		...commonSecuredResponses,
	},
});

export const updateUserRoute = createRoute({
	method: 'patch',
	path: '/{id}',
	tags: ['Users'],
	summary: 'Update a user',
	description: 'Update user details, roles, or status.',
	middleware: [requirePermission(ADMIN_USER_PERMISSIONS.UPDATE)] as const,
	request: {
		params: idParamSchema,
		body: {
			content: { 'application/json': { schema: updateUserRequestSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			description: 'User updated',
			content: { 'application/json': { schema: managedUserSchema } },
		},
		400: {
			description: 'Invalid user ID',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		403: {
			description: 'Cannot disable own account',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		404: {
			description: 'User not found',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		409: {
			description: 'Email already exists',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		...commonSecuredResponses,
	},
});

export const deleteUserRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Users'],
	summary: 'Delete a user',
	description: 'Soft delete a user.',
	middleware: [requirePermission(ADMIN_USER_PERMISSIONS.DELETE)] as const,
	request: { params: idParamSchema },
	responses: {
		200: {
			description: 'User deleted',
			content: { 'application/json': { schema: successMessageSchema } },
		},
		400: {
			description: 'Invalid user ID',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		404: {
			description: 'User not found',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		...commonSecuredResponses,
	},
});
