import type { OpenAPIHono } from '@hono/zod-openapi'
import { loginAs } from '../setup/auth-helpers'
import { getTestDb, resetAdminLockout } from '../setup/db-helpers'
import { createTestApp } from '../setup/test-app'

describe('POST /api/auth/login', () => {
	let app: OpenAPIHono
	let adminPassword: string

	beforeAll(() => {
		const password = process.env['INTEGRATION_TEST_ADMIN_PASSWORD']
		if (!password) {
			throw new Error('INTEGRATION_TEST_ADMIN_PASSWORD environment variable is required.')
		}
		adminPassword = password
		app = createTestApp()
	})

	describe('happy path', () => {
		it('returns 200 with user info and sets cookies on valid credentials', async () => {
			const { response, cookies } = await loginAs(app, 'admin@sistema.com', adminPassword)

			expect(response.status).toBe(200)

			const body = await response.json()
			expect(body.user).toMatchObject({
				email: 'admin@sistema.com',
				firstName: 'Administrador',
				lastName: 'Sistema',
			})

			expect(cookies.accessToken).toBeTruthy()
			expect(cookies.refreshToken).toBeTruthy()
		})
	})

	describe('authentication errors', () => {
		it('returns 401 for non-existent email', async () => {
			const { response } = await loginAs(app, 'nonexistent@test.com', 'password')
			expect(response.status).toBe(401)
		})

		it('returns 401 for wrong password', async () => {
			const { response } = await loginAs(app, 'admin@sistema.com', 'wrongpassword')
			expect(response.status).toBe(401)
		})
	})

	describe('validation errors', () => {
		it('returns 400 for missing body', async () => {
			const response = await app.request('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			})
			expect(response.status).toBe(400)
		})

		it('returns 400 for invalid email format', async () => {
			const response = await app.request('/api/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: 'not-an-email', password: adminPassword }),
			})
			expect(response.status).toBe(400)
		})
	})

	describe('account lockout', () => {
		afterEach(async () => {
			await resetAdminLockout(getTestDb())
		})

		it('locks account after multiple failed login attempts', async () => {
			// Attempt 5 failed logins (default MAX_FAILED_ATTEMPTS = 5)
			for (let i = 0; i < 5; i++) {
				await loginAs(app, 'admin@sistema.com', 'wrongpassword')
			}

			// Next attempt should be locked (even with correct password)
			const { response } = await loginAs(app, 'admin@sistema.com', adminPassword)

			expect(response.status).toBe(401)
			const body = await response.json()
			expect(body.code).toBe('ACCOUNT_LOCKED')
		})
	})
})
