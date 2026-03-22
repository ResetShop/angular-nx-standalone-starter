import { parseDurationToMs } from '@utils/duration'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
	DEFAULT_ACCESS_TOKEN_EXPIRY,
	DEFAULT_LOCKOUT_DURATION,
	DEFAULT_MAX_FAILED_ATTEMPTS,
	DEFAULT_REFRESH_TOKEN_EXPIRY,
} from '../../constants/auth.constants'
import { createAuthConfig } from './auth.config'

describe('createAuthConfig', () => {
	const originalEnv = process.env

	beforeEach(() => {
		process.env = { ...originalEnv }
	})

	afterEach(() => {
		process.env = originalEnv
	})

	describe('cookieSecure', () => {
		it('should default to true when COOKIE_SECURE is unset', () => {
			delete process.env['COOKIE_SECURE']
			expect(createAuthConfig().cookieSecure).toBe(true)
		})

		it('should return false when COOKIE_SECURE is "false"', () => {
			process.env['COOKIE_SECURE'] = 'false'
			expect(createAuthConfig().cookieSecure).toBe(false)
		})

		it('should return true when COOKIE_SECURE is "true"', () => {
			process.env['COOKIE_SECURE'] = 'true'
			expect(createAuthConfig().cookieSecure).toBe(true)
		})
	})

	describe('accessTokenExpiry', () => {
		it('should use DEFAULT_ACCESS_TOKEN_EXPIRY when env var is unset', () => {
			delete process.env['PASETO_ACCESS_TOKEN_EXPIRY']
			expect(createAuthConfig().accessTokenExpiry).toBe(DEFAULT_ACCESS_TOKEN_EXPIRY)
		})

		it('should use the env var value when set', () => {
			process.env['PASETO_ACCESS_TOKEN_EXPIRY'] = '30m'
			expect(createAuthConfig().accessTokenExpiry).toBe('30m')
		})
	})

	describe('refreshTokenExpiry', () => {
		it('should use DEFAULT_REFRESH_TOKEN_EXPIRY when env var is unset', () => {
			delete process.env['PASETO_REFRESH_TOKEN_EXPIRY']
			expect(createAuthConfig().refreshTokenExpiry).toBe(DEFAULT_REFRESH_TOKEN_EXPIRY)
		})

		it('should use the env var value when set', () => {
			process.env['PASETO_REFRESH_TOKEN_EXPIRY'] = '14d'
			expect(createAuthConfig().refreshTokenExpiry).toBe('14d')
		})
	})

	describe('maxFailedAttempts', () => {
		it('should use DEFAULT_MAX_FAILED_ATTEMPTS when env var is unset', () => {
			delete process.env['AUTH_MAX_FAILED_ATTEMPTS']
			expect(createAuthConfig().maxFailedAttempts).toBe(DEFAULT_MAX_FAILED_ATTEMPTS)
		})

		it('should parse a valid positive integer', () => {
			process.env['AUTH_MAX_FAILED_ATTEMPTS'] = '10'
			expect(createAuthConfig().maxFailedAttempts).toBe(10)
		})

		it('should fall back to default when value is zero', () => {
			process.env['AUTH_MAX_FAILED_ATTEMPTS'] = '0'
			expect(createAuthConfig().maxFailedAttempts).toBe(DEFAULT_MAX_FAILED_ATTEMPTS)
		})

		it('should fall back to default when value is negative', () => {
			process.env['AUTH_MAX_FAILED_ATTEMPTS'] = '-3'
			expect(createAuthConfig().maxFailedAttempts).toBe(DEFAULT_MAX_FAILED_ATTEMPTS)
		})

		it('should fall back to default when value is non-numeric', () => {
			process.env['AUTH_MAX_FAILED_ATTEMPTS'] = 'abc'
			expect(createAuthConfig().maxFailedAttempts).toBe(DEFAULT_MAX_FAILED_ATTEMPTS)
		})
	})

	describe('lockoutDurationMs', () => {
		it('should use DEFAULT_LOCKOUT_DURATION when env var is unset', () => {
			delete process.env['AUTH_LOCKOUT_DURATION']
			expect(createAuthConfig().lockoutDurationMs).toBe(parseDurationToMs(DEFAULT_LOCKOUT_DURATION))
		})

		it('should parse a valid duration string', () => {
			process.env['AUTH_LOCKOUT_DURATION'] = '30m'
			expect(createAuthConfig().lockoutDurationMs).toBe(parseDurationToMs('30m'))
		})

		it('should fall back to default when value is invalid', () => {
			process.env['AUTH_LOCKOUT_DURATION'] = 'not-a-duration'
			expect(createAuthConfig().lockoutDurationMs).toBe(parseDurationToMs(DEFAULT_LOCKOUT_DURATION))
		})
	})

	it('should return a frozen object', () => {
		const config = createAuthConfig()
		expect(Object.isFrozen(config)).toBe(true)
	})
})
