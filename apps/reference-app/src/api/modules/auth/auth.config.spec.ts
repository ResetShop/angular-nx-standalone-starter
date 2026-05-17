import { env } from '@config/env'
import { describe, expect, it } from 'vitest'
import { createAuthConfig } from './auth.config'

// All per-field validation lives in env.spec.ts. This spec only verifies the
// re-shape from env keys to AuthConfig field names and the frozen contract.
describe('createAuthConfig', () => {
	it('returns a frozen object', () => {
		expect(Object.isFrozen(createAuthConfig())).toBe(true)
	})

	it('mirrors the env values onto AuthConfig field names', () => {
		const config = createAuthConfig()
		expect(config.cookieSecure).toBe(env.COOKIE_SECURE)
		expect(config.accessTokenExpiry).toBe(env.PASETO_ACCESS_TOKEN_EXPIRY)
		expect(config.refreshTokenExpiry).toBe(env.PASETO_REFRESH_TOKEN_EXPIRY)
		expect(config.maxFailedAttempts).toBe(env.AUTH_MAX_FAILED_ATTEMPTS)
		expect(config.lockoutDuration).toBe(env.AUTH_LOCKOUT_DURATION)
		expect(config.cronSecret).toBe(env.CRON_SECRET)
	})
})
