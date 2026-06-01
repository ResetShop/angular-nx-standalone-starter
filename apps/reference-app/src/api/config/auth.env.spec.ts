import { clearAllMocks } from '@resetshop/util/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { type AuthEnv, authEnv, parseAuthEnv, resetAuthEnv, seedAuthEnv } from './auth.env'

function validMinimalEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
	return {
		PASETO_SECRET_KEY: 'a'.repeat(64),
		PASETO_ISSUER: 'test-issuer',
		...overrides,
	}
}

describe('parseAuthEnv', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	describe('PASETO_SECRET_KEY', () => {
		it('throws when missing', () => {
			const env = validMinimalEnv()
			delete env.PASETO_SECRET_KEY
			expect(() => parseAuthEnv(env)).toThrow()
		})

		it('throws when shorter than 64 hex characters', () => {
			expect(() => parseAuthEnv(validMinimalEnv({ PASETO_SECRET_KEY: 'a'.repeat(63) }))).toThrow(/at least 32 bytes/)
		})

		it('throws when contains non-hex characters', () => {
			expect(() => parseAuthEnv(validMinimalEnv({ PASETO_SECRET_KEY: 'g'.repeat(64) }))).toThrow(/at least 32 bytes/)
		})

		it('accepts a 64-character hex key', () => {
			expect(parseAuthEnv(validMinimalEnv({ PASETO_SECRET_KEY: 'a'.repeat(64) })).PASETO_SECRET_KEY).toBe(
				'a'.repeat(64),
			)
		})

		it('accepts a longer hex key', () => {
			const key = 'f'.repeat(128)
			expect(parseAuthEnv(validMinimalEnv({ PASETO_SECRET_KEY: key })).PASETO_SECRET_KEY).toBe(key)
		})

		it('accepts mixed-case hex', () => {
			const key = 'aAbBcCdDeEfF00112233445566778899aAbBcCdDeEfF00112233445566778899'
			expect(parseAuthEnv(validMinimalEnv({ PASETO_SECRET_KEY: key })).PASETO_SECRET_KEY).toBe(key)
		})
	})

	describe('PASETO_ISSUER', () => {
		it('throws when missing', () => {
			const env = validMinimalEnv()
			delete env.PASETO_ISSUER
			expect(() => parseAuthEnv(env)).toThrow()
		})

		it('throws when empty', () => {
			expect(() => parseAuthEnv(validMinimalEnv({ PASETO_ISSUER: '' }))).toThrow()
		})
	})

	describe('PASETO token expiries and clock tolerance', () => {
		it('applies default 15m / 7d / 1m when unset', () => {
			const env = parseAuthEnv(validMinimalEnv())
			expect(env.PASETO_ACCESS_TOKEN_EXPIRY).toBe('15m')
			expect(env.PASETO_REFRESH_TOKEN_EXPIRY).toBe('7d')
			expect(env.PASETO_CLOCK_TOLERANCE).toBe('1m')
		})

		it('uses the env value when set', () => {
			const env = parseAuthEnv(
				validMinimalEnv({
					PASETO_ACCESS_TOKEN_EXPIRY: '30m',
					PASETO_REFRESH_TOKEN_EXPIRY: '14d',
					PASETO_CLOCK_TOLERANCE: '30s',
				}),
			)
			expect(env.PASETO_ACCESS_TOKEN_EXPIRY).toBe('30m')
			expect(env.PASETO_REFRESH_TOKEN_EXPIRY).toBe('14d')
			expect(env.PASETO_CLOCK_TOLERANCE).toBe('30s')
		})
	})

	describe('COOKIE_SECURE', () => {
		it('defaults to true when unset', () => {
			expect(parseAuthEnv(validMinimalEnv()).COOKIE_SECURE).toBe(true)
		})

		it('returns false only when value is exactly "false"', () => {
			expect(parseAuthEnv(validMinimalEnv({ COOKIE_SECURE: 'false' })).COOKIE_SECURE).toBe(false)
		})

		it('returns true for "true"', () => {
			expect(parseAuthEnv(validMinimalEnv({ COOKIE_SECURE: 'true' })).COOKIE_SECURE).toBe(true)
		})

		it('returns true for any other value', () => {
			expect(parseAuthEnv(validMinimalEnv({ COOKIE_SECURE: 'yes' })).COOKIE_SECURE).toBe(true)
		})
	})

	describe('AUTH_MAX_FAILED_ATTEMPTS', () => {
		it('defaults to 5', () => {
			expect(parseAuthEnv(validMinimalEnv()).AUTH_MAX_FAILED_ATTEMPTS).toBe(5)
		})

		it('coerces a valid positive integer', () => {
			expect(parseAuthEnv(validMinimalEnv({ AUTH_MAX_FAILED_ATTEMPTS: '10' })).AUTH_MAX_FAILED_ATTEMPTS).toBe(10)
		})

		it('falls back to default on zero or negative', () => {
			expect(parseAuthEnv(validMinimalEnv({ AUTH_MAX_FAILED_ATTEMPTS: '0' })).AUTH_MAX_FAILED_ATTEMPTS).toBe(5)
			expect(parseAuthEnv(validMinimalEnv({ AUTH_MAX_FAILED_ATTEMPTS: '-3' })).AUTH_MAX_FAILED_ATTEMPTS).toBe(5)
		})

		it('falls back to default on non-numeric', () => {
			expect(parseAuthEnv(validMinimalEnv({ AUTH_MAX_FAILED_ATTEMPTS: 'abc' })).AUTH_MAX_FAILED_ATTEMPTS).toBe(5)
		})
	})

	describe('AUTH_LOCKOUT_DURATION', () => {
		it('defaults to "15m"', () => {
			expect(parseAuthEnv(validMinimalEnv()).AUTH_LOCKOUT_DURATION).toBe('15m')
		})

		it('uses a valid duration string', () => {
			expect(parseAuthEnv(validMinimalEnv({ AUTH_LOCKOUT_DURATION: '30m' })).AUTH_LOCKOUT_DURATION).toBe('30m')
		})

		it('falls back to default on invalid duration string', () => {
			expect(parseAuthEnv(validMinimalEnv({ AUTH_LOCKOUT_DURATION: 'not-a-duration' })).AUTH_LOCKOUT_DURATION).toBe(
				'15m',
			)
		})
	})

	describe('AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW', () => {
		it('defaults to "15m"', () => {
			expect(parseAuthEnv(validMinimalEnv()).AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW).toBe('15m')
		})

		it('uses a valid duration string', () => {
			expect(
				parseAuthEnv(validMinimalEnv({ AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW: '30m' }))
					.AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW,
			).toBe('30m')
		})

		it('falls back to default on invalid duration string', () => {
			expect(
				parseAuthEnv(validMinimalEnv({ AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW: 'not-a-duration' }))
					.AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW,
			).toBe('15m')
		})
	})

	describe('AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX', () => {
		it('defaults to 5', () => {
			expect(parseAuthEnv(validMinimalEnv()).AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX).toBe(5)
		})

		it('coerces a valid positive integer', () => {
			expect(
				parseAuthEnv(validMinimalEnv({ AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX: '10' }))
					.AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX,
			).toBe(10)
		})

		it('falls back to default on invalid values (tolerant)', () => {
			expect(
				parseAuthEnv(validMinimalEnv({ AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX: 'abc' }))
					.AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX,
			).toBe(5)
			expect(
				parseAuthEnv(validMinimalEnv({ AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX: '0' })).AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX,
			).toBe(5)
		})
	})

	describe('BCRYPT_COST', () => {
		it('defaults to 12', () => {
			expect(parseAuthEnv(validMinimalEnv()).BCRYPT_COST).toBe(12)
		})

		it('coerces a valid string to a number', () => {
			expect(parseAuthEnv(validMinimalEnv({ BCRYPT_COST: '1' })).BCRYPT_COST).toBe(1)
		})

		it('falls back to default on invalid values (tolerant)', () => {
			expect(parseAuthEnv(validMinimalEnv({ BCRYPT_COST: 'abc' })).BCRYPT_COST).toBe(12)
			expect(parseAuthEnv(validMinimalEnv({ BCRYPT_COST: '-3' })).BCRYPT_COST).toBe(12)
		})
	})

	describe('CRON_SECRET', () => {
		it('is undefined when unset', () => {
			expect(parseAuthEnv(validMinimalEnv()).CRON_SECRET).toBeUndefined()
		})

		it('passes through when set', () => {
			expect(parseAuthEnv(validMinimalEnv({ CRON_SECRET: 'a'.repeat(32) })).CRON_SECRET).toBe('a'.repeat(32))
		})
	})

	describe('AuthEnv type', () => {
		it('is assignable from a parseAuthEnv result', () => {
			const result: AuthEnv = parseAuthEnv(validMinimalEnv())
			expect(result.PASETO_SECRET_KEY).toBeDefined()
		})
	})
})

describe('seedAuthEnv / resetAuthEnv / authEnv proxy', () => {
	beforeEach(() => {
		resetAuthEnv()
	})

	afterEach(() => {
		resetAuthEnv()
		seedAuthEnv()
	})

	it('seedAuthEnv with no args uses the module-local test defaults', () => {
		seedAuthEnv()
		expect(authEnv.PASETO_SECRET_KEY).toBeDefined()
		expect(authEnv.PASETO_ISSUER).toBe('test-issuer')
	})

	it('seedAuthEnv applies overrides on top of defaults', () => {
		seedAuthEnv({ CRON_SECRET: 'override-secret' })
		expect(authEnv.CRON_SECRET).toBe('override-secret')
		// Defaults still apply for unspecified fields
		expect(authEnv.PASETO_ISSUER).toBe('test-issuer')
	})

	it('authEnv returns the same cached value across repeated property reads', () => {
		seedAuthEnv({ PASETO_ISSUER: 'cache-test' })
		const first = authEnv.PASETO_ISSUER
		const second = authEnv.PASETO_ISSUER
		expect(first).toBe(second)
	})

	it('resetAuthEnv clears the cache so the next seed takes effect', () => {
		seedAuthEnv({ PASETO_ISSUER: 'first' })
		expect(authEnv.PASETO_ISSUER).toBe('first')

		resetAuthEnv()
		seedAuthEnv({ PASETO_ISSUER: 'second' })
		expect(authEnv.PASETO_ISSUER).toBe('second')
	})
})
