import type { OpenAPIHono } from '@hono/zod-openapi'
import { createHmac } from 'crypto'
import { seedTokenEnv } from '../../config/token.env'
import { authenticatedRequest, loginAsAdmin } from '../setup/auth-helpers'
import { createTestApp } from '../setup/test-app'

const SECRET = 'placeholder-legacy-secret-for-tests-only'

describe('GET /api/auth/legacy-token', () => {
	let app: OpenAPIHono
	let adminCookies: Awaited<ReturnType<typeof loginAsAdmin>>

	beforeAll(async () => {
		app = createTestApp()
		adminCookies = await loginAsAdmin(app)
	})

	beforeEach(() => {
		seedTokenEnv({ LEGACY_JWT_SECRET: SECRET })
	})

	it('returns a token the legacy API would accept: HS256 under the shared secret with the user id as sub', async () => {
		const response = await authenticatedRequest(app, '/api/auth/legacy-token', { cookies: adminCookies })

		expect(response.status).toBe(200)
		const { token } = await response.json()
		const [header, payload, signature] = token.split('.')
		expect(signature).toBe(createHmac('sha256', SECRET).update(`${header}.${payload}`).digest('base64url'))
		const me = await (await authenticatedRequest(app, '/api/auth/me', { cookies: adminCookies })).json()
		expect(JSON.parse(Buffer.from(payload, 'base64url').toString()).sub).toBe(me.id)
	})

	it('requires a session', async () => {
		const response = await app.request('/api/auth/legacy-token')

		expect(response.status).toBe(401)
	})

	it('answers 503 while the legacy secret is not configured', async () => {
		seedTokenEnv()

		const response = await authenticatedRequest(app, '/api/auth/legacy-token', { cookies: adminCookies })

		expect(response.status).toBe(503)
	})
})
