export const PASETO_COOKIE_SCHEME = 'pasetoCookie';

export const OPENAPI_INFO = {
	title: 'Angular NX Starter API',
	version: '1.0.0',
	description: 'REST API with PASETO cookie authentication',
} as const;

export const commonSecuredResponses = {
	401: { description: 'Unauthorized - missing or invalid access token cookie' },
	403: { description: 'Forbidden - insufficient permissions' },
	500: { description: 'Internal server error' },
} as const;
