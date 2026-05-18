import { authEnv, parseAuthEnv } from '@config/auth.env'
import { describe, expect, it } from 'vitest'
import { createAuthConfig } from './auth.config'

// Per-field validation and default behavior live in auth.env.spec.ts (the
// auth sub-schema is the source of truth). This spec covers the re-shape from
// auth env keys to AuthConfig field names — invoked via the `parseAuthEnv`-driven
// overload so the mapping is verified without `process.env` mutation.
//
// Explicitly NOT covered here (already in auth.env.spec.ts):
//   - schema-level validation of COOKIE_SECURE / PASETO_*_EXPIRY / etc.
//   - tolerant fallback for AUTH_MAX_FAILED_ATTEMPTS and AUTH_LOCKOUT_DURATION
//   - default values when env vars are unset
// New tests added here should focus on the env-to-AuthConfig field mapping
// (especially when new AuthConfig fields are added), not on schema behavior.
describe('createAuthConfig', () => {
	it('returns a frozen object', () => {
		expect(Object.isFrozen(createAuthConfig())).toBe(true)
	})

	it('mirrors the singleton authEnv values onto AuthConfig field names', () => {
		const config = createAuthConfig()
		expect(config.cookieSecure).toBe(authEnv.COOKIE_SECURE)
		expect(config.accessTokenExpiry).toBe(authEnv.PASETO_ACCESS_TOKEN_EXPIRY)
		expect(config.refreshTokenExpiry).toBe(authEnv.PASETO_REFRESH_TOKEN_EXPIRY)
		expect(config.maxFailedAttempts).toBe(authEnv.AUTH_MAX_FAILED_ATTEMPTS)
		expect(config.lockoutDuration).toBe(authEnv.AUTH_LOCKOUT_DURATION)
	})

	it('maps each authEnv field to the correct AuthConfig field via the explicit-env overload', () => {
		const customEnv = parseAuthEnv({
			PASETO_SECRET_KEY: 'a'.repeat(64),
			PASETO_ISSUER: 'mapping-test',
			COOKIE_SECURE: 'false',
			PASETO_ACCESS_TOKEN_EXPIRY: '20m',
			PASETO_REFRESH_TOKEN_EXPIRY: '14d',
			AUTH_MAX_FAILED_ATTEMPTS: '7',
			AUTH_LOCKOUT_DURATION: '45m',
			CRON_SECRET: 'cron-mapping-secret',
		})

		const config = createAuthConfig(customEnv)

		expect(config.cookieSecure).toBe(false)
		expect(config.accessTokenExpiry).toBe('20m')
		expect(config.refreshTokenExpiry).toBe('14d')
		expect(config.maxFailedAttempts).toBe(7)
		expect(config.lockoutDuration).toBe('45m')
		expect(config.cronSecret).toBe('cron-mapping-secret')
	})

	it('leaves cronSecret undefined when CRON_SECRET is unset', () => {
		const customEnv = parseAuthEnv({
			PASETO_SECRET_KEY: 'a'.repeat(64),
			PASETO_ISSUER: 'mapping-test',
		})

		expect(createAuthConfig(customEnv).cronSecret).toBeUndefined()
	})
})
