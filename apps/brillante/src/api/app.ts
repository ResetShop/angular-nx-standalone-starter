import { extendZodWithOpenApi } from '@hono/zod-openapi'
import { z } from 'zod'

// Must run before any schema or controller import
extendZodWithOpenApi(z)

import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { httpEnv } from './config/http.env'
import { ACCESS_TOKEN_COOKIE_NAME } from './constants/auth.constants'
import verifyAccessToken from './middlewares/verify-access-token.middleware'
import { CRON_SECRET_SCHEME, OPENAPI_INFO, PASETO_COOKIE_SCHEME } from './openapi-config'
import routes, { PUBLIC_AUTH_ROUTES } from './routes'
import { buildSwaggerHtml } from './swagger-ui'

/**
 * Assembles the API: CORS, security headers, token verification, the module routers, the OpenAPI
 * spec and Swagger UI. Everything that is independent of the hosting runtime lives here; the
 * Cloudflare Worker adds the per-request database client around it (`worker.ts`).
 */
export function createApiApp(): OpenAPIHono {
	const app = new OpenAPIHono({ strict: false })

	app.use(requestId())
	app.use('*', lazyCors())
	app.use(secureHeaders())
	app.use('/api/*', requireAccessTokenExceptPublicRoutes)

	for (const route of routes) {
		app.route(`/api${route.path}`, route.controller)
	}

	registerOpenApiDocument(app)

	app.notFound((c) => c.text('404 - Not found', 404))
	app.onError((error, c) => {
		console.error(`${error}`)
		return c.text('Internal Server Error', 500)
	})

	return app
}

/**
 * Builds the cors() middleware on the first request rather than at module-eval so that importing
 * this module never reads `httpEnv`. `CORS_ORIGIN` may be one origin or a comma-separated list.
 */
function lazyCors(): ReturnType<typeof cors> {
	let corsMiddleware: ReturnType<typeof cors> | null = null
	return (c, next) => {
		corsMiddleware ??= cors({
			origin: httpEnv.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
			credentials: true,
			allowHeaders: ['Content-Type', 'Authorization'],
			allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
			maxAge: httpEnv.CORS_MAX_AGE,
		})
		return corsMiddleware(c, next)
	}
}

/**
 * Every /api/* route requires a valid access token except the public ones (login, refresh, logout,
 * password reset, cleanup trigger, health, docs). Must be registered before the routes.
 */
const requireAccessTokenExceptPublicRoutes: Parameters<OpenAPIHono['use']>[1] = (c, next) => {
	if (PUBLIC_AUTH_ROUTES.some((publicPath) => c.req.path.startsWith(publicPath))) {
		return next()
	}
	return verifyAccessToken(c, next)
}

function registerOpenApiDocument(app: OpenAPIHono): void {
	app.openAPIRegistry.registerComponent('securitySchemes', PASETO_COOKIE_SCHEME, {
		type: 'apiKey',
		in: 'cookie',
		name: ACCESS_TOKEN_COOKIE_NAME,
		description: 'PASETO access token stored as an HttpOnly cookie',
	})

	app.openAPIRegistry.registerComponent('securitySchemes', CRON_SECRET_SCHEME, {
		type: 'http',
		scheme: 'bearer',
		description: 'CRON_SECRET passed as a Bearer token for scheduled job invocations',
	})

	app.doc('/api/openapi.json', {
		openapi: '3.0.0',
		info: OPENAPI_INFO,
		tags: [
			{ name: 'Health', description: 'Health check endpoints' },
			{ name: 'Auth', description: 'Authentication endpoints' },
			{ name: 'Permissions', description: 'Permission management endpoints' },
			{ name: 'Roles', description: 'Role management endpoints' },
			{ name: 'Users', description: 'User management endpoints' },
			{ name: 'User Roles', description: 'User-role assignment endpoints' },
		],
		security: [{ [PASETO_COOKIE_SCHEME]: [] }],
	})

	app.get('/api/docs', (c) => c.html(buildSwaggerHtml()))
}
