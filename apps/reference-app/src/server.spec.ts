import { describe, expect, it } from 'vitest'
import { app } from './server'

/**
 * These tests guard the lazy-init contract for the CORS middleware:
 * importing the server bundle must not read env at module-eval (the env proxies
 * `process.exit(1)` on missing values, which would abort the test worker), and the
 * cors() middleware must be built and applied on the first request instead.
 */
describe('server module', () => {
	it('exports the app without reading env at import time', () => {
		// If importing ./server triggered an env-proxy read with missing values,
		// the worker would have exited before reaching this assertion.
		expect(app).toBeDefined()
	})

	it('applies CORS headers on the first request', async () => {
		const res = await app.request('/api/auth/login', {
			method: 'OPTIONS',
			headers: {
				Origin: 'http://localhost:4200',
				'Access-Control-Request-Method': 'POST',
			},
		})

		expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:4200')
	})
})
