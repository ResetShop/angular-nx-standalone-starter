import { AuthError, InternalAuthErrorCode } from '@contracts/auth/auth.errors'
import { parseDurationToMs } from '@resetshop/util'
import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { Hono } from 'hono'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { seedTokenEnv } from '../../config/token.env'
import { container } from '../../container/container'
import { InMemoryContainer } from '../../container/container.mock'
import { setAuthenticatedUser } from '../../middlewares/verify-access-token.middleware.mock'
import type { UserData } from '../user/interfaces'
import authController from './auth.controller'

const SECRET = 'placeholder-legacy-secret-for-tests-only'

describe('Auth Controller - /legacy-token endpoint', () => {
	const app = new Hono()
	app.use('/auth/*', async (c, next) => {
		if (c.req.header('Authorization') === 'Bearer valid-token') {
			setAuthenticatedUser(c, { sub: '7', email: 'a@b.test', firstName: 'Ana', lastName: 'Fake' })
		}
		await next()
	})
	app.route('/auth', authController)

	const getSessionUser = fn<[number], Promise<UserData>>()
	const request = () => app.request('/auth/legacy-token', { headers: { Authorization: 'Bearer valid-token' } })

	beforeEach(() => {
		clearAllMocks()
		seedTokenEnv({ LEGACY_JWT_SECRET: SECRET })
		getSessionUser.mockResolvedValue({
			id: 7,
			email: 'a@b.test',
			firstName: 'Ana',
			lastName: 'Fake',
			status: 'active',
		})
		container.use(new InMemoryContainer({ authService: { getSessionUser } }))
	})

	afterEach(() => {
		container.restore()
	})

	it('returns 401 without a session', async () => {
		const res = await app.request('/auth/legacy-token')

		expect(res.status).toBe(401)
	})

	it('returns a token for the signed-in user and an expiry one hour away by default', async () => {
		const res = await request()

		expect(res.status).toBe(200)
		expect(res.headers.get('Cache-Control')).toBe('no-store')
		const { token, expiresAt } = await res.json()
		const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
		expect(claims.sub).toBe(7)
		expect(new Date(expiresAt).getTime() - Date.now()).toBeGreaterThan(parseDurationToMs('59m'))
	})

	it('answers 503 and signs nothing while the legacy secret is not configured', async () => {
		seedTokenEnv()

		const res = await request()

		expect(res.status).toBe(503)
		expect(await res.json()).toEqual({ error: 'Legacy token bridge is not configured' })
	})

	it('answers 401 when the account is no longer active', async () => {
		getSessionUser.mockRejectedValue(new AuthError(InternalAuthErrorCode.ACCOUNT_DISABLED))

		const res = await request()

		expect(res.status).toBe(401)
		expect(await res.json()).toEqual({ error: 'Unauthorized' })
	})

	it('propagates a non-auth failure instead of turning it into a 401', async () => {
		getSessionUser.mockRejectedValue(new Error('Database connection failed'))

		expect((await request()).status).toBe(500)
	})
})
