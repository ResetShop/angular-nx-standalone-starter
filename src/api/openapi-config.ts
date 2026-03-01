import { errorResponseSchema } from '@contracts/common/error.schemas';

export const PASETO_COOKIE_SCHEME = 'pasetoCookie';
export const CRON_SECRET_SCHEME = 'cronSecret';

export const OPENAPI_INFO = {
	title: 'Angular NX Starter API',
	version: '1.0.0',
	description: 'REST API with PASETO cookie authentication',
} as const;

export const commonSecuredResponses = {
	401: {
		description: 'Unauthorized - missing or invalid access token cookie',
		content: { 'application/json': { schema: errorResponseSchema } },
	},
	403: {
		description: 'Forbidden - insufficient permissions',
		content: { 'application/json': { schema: errorResponseSchema } },
	},
	500: {
		description: 'Internal server error',
		content: { 'application/json': { schema: errorResponseSchema } },
	},
};
