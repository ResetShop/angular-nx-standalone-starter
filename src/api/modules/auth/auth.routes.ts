import {
	authErrorResponseSchema,
	cleanupTokensResponseSchema,
	loginRequestSchema,
	loginResponseSchema,
	logoutResponseSchema,
	meResponseSchema,
	refreshResponseSchema,
} from '@contracts/auth/auth.schemas';
import { errorResponseSchema } from '@contracts/common/error.schemas';
import { createRoute } from '@hono/zod-openapi';
import { CRON_SECRET_SCHEME, PASETO_COOKIE_SCHEME, commonSecuredResponses } from '../../openapi-config';

export const loginRoute = createRoute({
	method: 'post',
	path: '/login',
	tags: ['Auth'],
	summary: 'Authenticate user',
	description: 'Authenticates a user with email and password. Sets access and refresh tokens as HttpOnly cookies.',
	security: [],
	request: {
		body: {
			content: { 'application/json': { schema: loginRequestSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			description: 'Successfully authenticated',
			content: { 'application/json': { schema: loginResponseSchema } },
		},
		401: {
			description: 'Authentication failed',
			content: { 'application/json': { schema: authErrorResponseSchema } },
		},
	},
});

export const refreshRoute = createRoute({
	method: 'post',
	path: '/refresh',
	tags: ['Auth'],
	summary: 'Refresh access token',
	description: 'Exchanges refresh token cookie for new access and refresh tokens.',
	security: [],
	responses: {
		200: {
			description: 'Tokens refreshed successfully',
			content: { 'application/json': { schema: refreshResponseSchema } },
		},
		401: {
			description: 'Invalid or missing refresh token',
			content: { 'application/json': { schema: authErrorResponseSchema } },
		},
	},
});

export const meRoute = createRoute({
	method: 'get',
	path: '/me',
	tags: ['Auth'],
	summary: 'Get current user',
	description: 'Returns the authenticated user with roles and permissions.',
	responses: {
		200: {
			description: 'Current user information',
			content: { 'application/json': { schema: meResponseSchema } },
		},
		...commonSecuredResponses,
	},
});

export const logoutRoute = createRoute({
	method: 'post',
	path: '/logout',
	tags: ['Auth'],
	summary: 'Logout user',
	description: 'Revokes all refresh tokens and clears cookies. Always succeeds from client perspective.',
	security: [],
	responses: {
		200: {
			description: 'Logged out successfully',
			content: { 'application/json': { schema: logoutResponseSchema } },
		},
	},
});

export const cleanupTokensRoute = createRoute({
	method: 'get',
	path: '/cleanup-tokens',
	tags: ['Auth'],
	summary: 'Cleanup expired tokens',
	description:
		'Manually triggers expired token cleanup. Accepts either a CRON_SECRET Bearer token or an authenticated user session.',
	security: [{ [PASETO_COOKIE_SCHEME]: [] }, { [CRON_SECRET_SCHEME]: [] }],
	responses: {
		200: {
			description: 'Cleanup result',
			content: { 'application/json': { schema: cleanupTokensResponseSchema } },
		},
		401: {
			description: 'Unauthorized',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
		500: {
			description: 'Cleanup failed',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
	},
});
