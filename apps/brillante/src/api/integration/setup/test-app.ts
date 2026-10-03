import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { secureHeaders } from 'hono/secure-headers'
import { ACCESS_TOKEN_COOKIE_NAME } from '../../constants/auth.constants'
import verifyAccessToken from '../../middlewares/verify-access-token.middleware'
import { CRON_SECRET_SCHEME, OPENAPI_INFO, PASETO_COOKIE_SCHEME } from '../../openapi-config'
import routes, { PUBLIC_AUTH_ROUTES } from '../../routes'
import { createInMemoryRateLimitBindings } from './in-memory-rate-limit-bindings'

/**
 * Creates a Hono app instance mirroring the production Worker setup, but without the per-request
 * Hyperdrive client (integration tests share one pooled connection), static assets or the Cron
 * Trigger. The rate limit bindings Cloudflare provides at runtime are replaced by in-memory fakes
 * that apply the same limits.
 */
export function createTestApp(): OpenAPIHono {
	const app = new OpenAPIHono({ strict: false })

	const rateLimitBindings = createInMemoryRateLimitBindings()
	app.use('*', async (c, next) => {
		c.env = { ...c.env, ...rateLimitBindings }
		await next()
	})
	app.use(requestId())
	app.use(
		'*',
		cors({
			origin: 'http://localhost:4200',
			credentials: true,
			allowHeaders: ['Content-Type', 'Authorization'],
			allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		}),
	)
	app.use(secureHeaders())

	// Apply auth middleware to all API routes except public ones
	app.use('/api/*', async (c, next) => {
		const path = c.req.path
		if (PUBLIC_AUTH_ROUTES.some((p) => path.startsWith(p))) {
			return next()
		}
		return verifyAccessToken(c, next)
	})

	// Mount all route controllers
	for (const route of routes) {
		app.route(`/api${route.path}`, route.controller)
	}

	// Register security schemes
	app.openAPIRegistry.registerComponent('securitySchemes', PASETO_COOKIE_SCHEME, {
		type: 'apiKey',
		in: 'cookie',
		name: ACCESS_TOKEN_COOKIE_NAME,
	})

	app.openAPIRegistry.registerComponent('securitySchemes', CRON_SECRET_SCHEME, {
		type: 'http',
		scheme: 'bearer',
	})

	app.doc('/api/openapi.json', {
		openapi: '3.0.0',
		info: OPENAPI_INFO,
		security: [{ [PASETO_COOKIE_SCHEME]: [] }],
	})

	app.notFound((c) => c.text('404 - Not found', 404))
	app.onError((error, c) => {
		console.error('[Integration Test Error]', error)
		return c.text('Internal Server Error', 500)
	})

	return app
}
