import type { OpenAPIHono } from '@hono/zod-openapi'
import { passwordResetToken } from '@schema/password-reset-token'
import { eq } from 'drizzle-orm'
import { getSeededAdminIds, getTestDb } from '../setup/db-helpers'
import { createTestApp } from '../setup/test-app'

describe('POST /api/auth/forgot-password', () => {
	let app: OpenAPIHono
	let adminUserId: number
	let ipCounter = 0

	beforeAll(async () => {
		app = createTestApp()
		const ids = await getSeededAdminIds(getTestDb())
		adminUserId = ids.adminUserId
	})

	afterEach(async () => {
		// Remove any reset tokens created for the seeded admin so state does not leak between tests.
		await getTestDb().delete(passwordResetToken).where(eq(passwordResetToken.userId, adminUserId))
	})

	// Unique IP per call so the per-IP rate limiter never trips across tests.
	async function forgotPassword(email: string): Promise<Response> {
		return await app.request('/api/auth/forgot-password', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `10.50.0.${++ipCounter}` },
			body: JSON.stringify({ email }),
		})
	}

	// The token + email work runs AFTER the response (deferAfterResponse), so the row appears
	// asynchronously — poll for it. Also serves to drain the deferred write before afterEach cleanup.
	async function waitForResetTokens(userId: number): Promise<{ id: number }[]> {
		for (let attempt = 0; attempt < 80; attempt++) {
			const rows = await getTestDb()
				.select({ id: passwordResetToken.id })
				.from(passwordResetToken)
				.where(eq(passwordResetToken.userId, userId))
			if (rows.length > 0) return rows
			await new Promise((resolve) => setTimeout(resolve, 25))
		}
		return []
	}

	it('returns 200 and creates a reset token for an existing active account', async () => {
		const response = await forgotPassword('admin@sistema.com')

		expect(response.status).toBe(200)
		// Created by deferred post-response work — poll until it lands.
		expect(await waitForResetTokens(adminUserId)).toHaveLength(1)
	})

	it('returns 200 with an identical body for a known and an unknown email (no enumeration)', async () => {
		const known = await forgotPassword('admin@sistema.com')
		const unknown = await forgotPassword('no-such-user@test.com')

		expect(known.status).toBe(200)
		expect(unknown.status).toBe(200)
		expect(await unknown.json()).toEqual(await known.json())

		// Drain the known email's deferred token write so afterEach reliably cleans it up.
		await waitForResetTokens(adminUserId)
	})

	it('returns 400 for an invalid email format', async () => {
		const response = await forgotPassword('not-an-email')

		expect(response.status).toBe(400)
	})
})
