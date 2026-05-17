import { env, parseEnv } from '@config/env'
import { describe, expect, it } from 'vitest'
import { createAuthConfig } from './auth.config'

// Per-field validation and default behavior live in env.spec.ts (the schema is
// the source of truth). This spec covers the re-shape from env keys to
// AuthConfig field names — invoked via the `parseEnv`-driven overload so the
// mapping is verified without `process.env` mutation.
describe('createAuthConfig', () => {
	it('returns a frozen object', () => {
		expect(Object.isFrozen(createAuthConfig())).toBe(true)
	})

	it('mirrors the singleton env values onto AuthConfig field names', () => {
		const config = createAuthConfig()
		expect(config.cookieSecure).toBe(env.COOKIE_SECURE)
		expect(config.accessTokenExpiry).toBe(env.PASETO_ACCESS_TOKEN_EXPIRY)
		expect(config.refreshTokenExpiry).toBe(env.PASETO_REFRESH_TOKEN_EXPIRY)
		expect(config.maxFailedAttempts).toBe(env.AUTH_MAX_FAILED_ATTEMPTS)
		expect(config.lockoutDuration).toBe(env.AUTH_LOCKOUT_DURATION)
	})

	it('maps each env field to the correct AuthConfig field via the explicit-env overload', () => {
		const customEnv = parseEnv({
			PG_CONNECTION_STRING: 'postgresql://test:test@localhost:5432/test',
			PASETO_SECRET_KEY: 'a'.repeat(64),
			PASETO_ISSUER: 'mapping-test',
			EMAIL_PROVIDER: 'ethereal',
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
		const customEnv = parseEnv({
			PG_CONNECTION_STRING: 'postgresql://test:test@localhost:5432/test',
			PASETO_SECRET_KEY: 'a'.repeat(64),
			PASETO_ISSUER: 'mapping-test',
			EMAIL_PROVIDER: 'ethereal',
		})

		expect(createAuthConfig(customEnv).cronSecret).toBeUndefined()
	})
})
