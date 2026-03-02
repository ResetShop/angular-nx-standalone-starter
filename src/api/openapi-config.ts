import { errorResponseSchema } from '@contracts/common/error.schemas';
import { z } from '@hono/zod-openapi';

export const PASETO_COOKIE_SCHEME = 'pasetoCookie';
export const CRON_SECRET_SCHEME = 'cronSecret';

export const OPENAPI_INFO = {
	title: 'Angular NX Starter API',
	version: '1.0.0',
	description: 'REST API with PASETO cookie authentication',
} as const;

/** Reusable path parameter schema for endpoints that take a single numeric ID. */
export const idParamSchema = z.object({
	id: z.coerce.number().int().positive().openapi({ description: 'Resource ID', example: 1 }),
});

/** Auth-only responses (401+403) for read endpoints where 500 is not material. */
export const commonAuthResponses = {
	401: {
		description: 'Unauthorized - missing or invalid access token cookie',
		content: { 'application/json': { schema: errorResponseSchema } },
	},
	403: {
		description: 'Forbidden - insufficient permissions',
		content: { 'application/json': { schema: errorResponseSchema } },
	},
};

/** Full secured responses (401+403+500) for write endpoints and endpoints with non-trivial error paths. */
export const commonSecuredResponses = {
	...commonAuthResponses,
	500: {
		description: 'Internal server error',
		content: { 'application/json': { schema: errorResponseSchema } },
	},
};
