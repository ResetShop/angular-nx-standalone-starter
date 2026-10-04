import { OpenAPIHono } from '@hono/zod-openapi'
import { createApiApp } from '../../app'
import { createInMemoryRateLimitBindings } from './in-memory-rate-limit-bindings'

/**
 * Creates the production API (`createApiApp`) as the integration suite's app. The only differences
 * from the Worker are platform bindings: Cloudflare provides the Rate Limiting bindings at
 * runtime, so they are replaced by in-memory fakes that apply the same limits, and the tests
 * share one pooled database connection instead of a client per request.
 */
export function createTestApp(): OpenAPIHono {
	const rateLimitBindings = createInMemoryRateLimitBindings()
	const app = new OpenAPIHono({ strict: false })

	app.use('*', async (c, next) => {
		c.env = { ...c.env, ...rateLimitBindings }
		await next()
	})
	app.route('/', createApiApp())

	return app
}
