import { clearAllMocks } from '@resetshop/util/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { type Env, parseEnv } from './env'

function validMinimalEnv(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
	return {
		PG_CONNECTION_STRING: 'postgresql://test:test@localhost:5432/test',
		PASETO_SECRET_KEY: 'a'.repeat(64),
		PASETO_ISSUER: 'test-issuer',
		EMAIL_PROVIDER: 'ethereal',
		...overrides,
	}
}

describe('parseEnv', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	describe('NODE_ENV', () => {
		it('defaults to "development" when unset', () => {
			expect(parseEnv(validMinimalEnv()).NODE_ENV).toBe('development')
		})

		it('accepts "test" and "production"', () => {
			expect(parseEnv(validMinimalEnv({ NODE_ENV: 'test' })).NODE_ENV).toBe('test')
			expect(parseEnv(validMinimalEnv({ NODE_ENV: 'production' })).NODE_ENV).toBe('production')
		})

		it('rejects unknown values', () => {
			expect(() => parseEnv(validMinimalEnv({ NODE_ENV: 'staging' }))).toThrow()
		})
	})

	describe('PG_CONNECTION_STRING', () => {
		it('throws when missing', () => {
			const env = validMinimalEnv()
			delete env.PG_CONNECTION_STRING
			expect(() => parseEnv(env)).toThrow()
		})

		it('throws when empty', () => {
			expect(() => parseEnv(validMinimalEnv({ PG_CONNECTION_STRING: '' }))).toThrow()
		})

		it('passes through a valid connection string', () => {
			const cs = 'postgresql://user:pass@localhost:5432/db'
			expect(parseEnv(validMinimalEnv({ PG_CONNECTION_STRING: cs })).PG_CONNECTION_STRING).toBe(cs)
		})
	})

	describe('PASETO_SECRET_KEY', () => {
		it('throws when missing', () => {
			const env = validMinimalEnv()
			delete env.PASETO_SECRET_KEY
			expect(() => parseEnv(env)).toThrow()
		})

		it('throws when shorter than 64 hex characters', () => {
			expect(() => parseEnv(validMinimalEnv({ PASETO_SECRET_KEY: 'a'.repeat(63) }))).toThrow(/at least 32 bytes/)
		})

		it('throws when contains non-hex characters', () => {
			expect(() => parseEnv(validMinimalEnv({ PASETO_SECRET_KEY: 'g'.repeat(64) }))).toThrow(/at least 32 bytes/)
		})

		it('accepts a 64-character hex key', () => {
			expect(parseEnv(validMinimalEnv({ PASETO_SECRET_KEY: 'a'.repeat(64) })).PASETO_SECRET_KEY).toBe('a'.repeat(64))
		})

		it('accepts a longer hex key', () => {
			const key = 'f'.repeat(128)
			expect(parseEnv(validMinimalEnv({ PASETO_SECRET_KEY: key })).PASETO_SECRET_KEY).toBe(key)
		})

		it('accepts mixed-case hex', () => {
			const key = 'aAbBcCdDeEfF00112233445566778899aAbBcCdDeEfF00112233445566778899'
			expect(parseEnv(validMinimalEnv({ PASETO_SECRET_KEY: key })).PASETO_SECRET_KEY).toBe(key)
		})
	})

	describe('PASETO_ISSUER', () => {
		it('throws when missing', () => {
			const env = validMinimalEnv()
			delete env.PASETO_ISSUER
			expect(() => parseEnv(env)).toThrow()
		})

		it('throws when empty', () => {
			expect(() => parseEnv(validMinimalEnv({ PASETO_ISSUER: '' }))).toThrow()
		})
	})

	describe('PASETO token expiries and clock tolerance', () => {
		it('applies default 15m / 7d / 1m when unset', () => {
			const env = parseEnv(validMinimalEnv())
			expect(env.PASETO_ACCESS_TOKEN_EXPIRY).toBe('15m')
			expect(env.PASETO_REFRESH_TOKEN_EXPIRY).toBe('7d')
			expect(env.PASETO_CLOCK_TOLERANCE).toBe('1m')
		})

		it('uses the env value when set', () => {
			const env = parseEnv(
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
			expect(parseEnv(validMinimalEnv()).COOKIE_SECURE).toBe(true)
		})

		it('returns false only when value is exactly "false"', () => {
			expect(parseEnv(validMinimalEnv({ COOKIE_SECURE: 'false' })).COOKIE_SECURE).toBe(false)
		})

		it('returns true for "true"', () => {
			expect(parseEnv(validMinimalEnv({ COOKIE_SECURE: 'true' })).COOKIE_SECURE).toBe(true)
		})

		it('returns true for any other value', () => {
			expect(parseEnv(validMinimalEnv({ COOKIE_SECURE: 'yes' })).COOKIE_SECURE).toBe(true)
		})
	})

	describe('EMAIL_PROVIDER', () => {
		it('defaults to "nodemailer" (requires SMTP_* when default kicks in)', () => {
			const env = validMinimalEnv()
			delete env.EMAIL_PROVIDER
			expect(() => parseEnv(env)).toThrow(/SMTP_HOST is required/)
		})

		it('accepts "ethereal"', () => {
			expect(parseEnv(validMinimalEnv({ EMAIL_PROVIDER: 'ethereal' })).EMAIL_PROVIDER).toBe('ethereal')
		})

		it('accepts "noop"', () => {
			expect(parseEnv(validMinimalEnv({ EMAIL_PROVIDER: 'noop' })).EMAIL_PROVIDER).toBe('noop')
		})

		it('rejects unknown providers', () => {
			expect(() => parseEnv(validMinimalEnv({ EMAIL_PROVIDER: 'sendgrid' }))).toThrow()
		})
	})

	describe('SMTP cross-field refinement', () => {
		it('requires SMTP_HOST/USER/PASS when EMAIL_PROVIDER=nodemailer', () => {
			expect(() => parseEnv(validMinimalEnv({ EMAIL_PROVIDER: 'nodemailer' }))).toThrow(/SMTP_HOST is required/)
		})

		it('succeeds when all SMTP credentials are present with nodemailer', () => {
			const env = parseEnv(
				validMinimalEnv({
					EMAIL_PROVIDER: 'nodemailer',
					SMTP_HOST: 'smtp.example.com',
					SMTP_USER: 'user@example.com',
					SMTP_PASS: 'secret',
				}),
			)
			expect(env.EMAIL_PROVIDER).toBe('nodemailer')
			expect(env.SMTP_HOST).toBe('smtp.example.com')
		})

		it('skips the refinement for ethereal', () => {
			expect(() => parseEnv(validMinimalEnv({ EMAIL_PROVIDER: 'ethereal' }))).not.toThrow()
		})

		it('skips the refinement for noop', () => {
			expect(() => parseEnv(validMinimalEnv({ EMAIL_PROVIDER: 'noop' }))).not.toThrow()
		})
	})

	describe('SMTP_PORT', () => {
		it('defaults to 587', () => {
			expect(parseEnv(validMinimalEnv()).SMTP_PORT).toBe(587)
		})

		it('coerces a valid string to a number', () => {
			expect(parseEnv(validMinimalEnv({ SMTP_PORT: '465' })).SMTP_PORT).toBe(465)
		})

		it('throws on out-of-range values', () => {
			expect(() => parseEnv(validMinimalEnv({ SMTP_PORT: '99999' }))).toThrow()
		})

		it('throws on non-numeric values', () => {
			expect(() => parseEnv(validMinimalEnv({ SMTP_PORT: 'abc' }))).toThrow()
		})
	})

	describe('SMTP_SECURE', () => {
		it('defaults to false', () => {
			expect(parseEnv(validMinimalEnv()).SMTP_SECURE).toBe(false)
		})

		it('returns true only for "true"', () => {
			expect(parseEnv(validMinimalEnv({ SMTP_SECURE: 'true' })).SMTP_SECURE).toBe(true)
			expect(parseEnv(validMinimalEnv({ SMTP_SECURE: '1' })).SMTP_SECURE).toBe(false)
		})
	})

	describe('SMTP_FROM', () => {
		it('defaults to noreply@example.com', () => {
			expect(parseEnv(validMinimalEnv()).SMTP_FROM).toBe('noreply@example.com')
		})
	})

	describe('IS_SERVERLESS', () => {
		it('defaults to false', () => {
			expect(parseEnv(validMinimalEnv()).IS_SERVERLESS).toBe(false)
		})

		it('returns true only for "true"', () => {
			expect(parseEnv(validMinimalEnv({ IS_SERVERLESS: 'true' })).IS_SERVERLESS).toBe(true)
			expect(parseEnv(validMinimalEnv({ IS_SERVERLESS: '1' })).IS_SERVERLESS).toBe(false)
			expect(parseEnv(validMinimalEnv({ IS_SERVERLESS: 'false' })).IS_SERVERLESS).toBe(false)
		})
	})

	describe('PORT', () => {
		it('defaults to 4000', () => {
			expect(parseEnv(validMinimalEnv()).PORT).toBe(4000)
		})

		it('coerces a valid string to a number', () => {
			expect(parseEnv(validMinimalEnv({ PORT: '3000' })).PORT).toBe(3000)
		})

		it('falls back to default on invalid values (tolerant)', () => {
			expect(parseEnv(validMinimalEnv({ PORT: 'abc' })).PORT).toBe(4000)
		})
	})

	describe('CORS_ORIGIN and CORS_MAX_AGE', () => {
		it('applies defaults', () => {
			const env = parseEnv(validMinimalEnv())
			expect(env.CORS_ORIGIN).toBe('http://localhost:4200')
			expect(env.CORS_MAX_AGE).toBe(86400)
		})

		it('uses env values when set', () => {
			const env = parseEnv(validMinimalEnv({ CORS_ORIGIN: 'https://example.com', CORS_MAX_AGE: '3600' }))
			expect(env.CORS_ORIGIN).toBe('https://example.com')
			expect(env.CORS_MAX_AGE).toBe(3600)
		})

		it('falls back to default on invalid CORS_MAX_AGE (tolerant)', () => {
			expect(parseEnv(validMinimalEnv({ CORS_MAX_AGE: 'abc' })).CORS_MAX_AGE).toBe(86400)
		})
	})

	describe('BCRYPT_COST', () => {
		it('defaults to 12', () => {
			expect(parseEnv(validMinimalEnv()).BCRYPT_COST).toBe(12)
		})

		it('coerces a valid string to a number', () => {
			expect(parseEnv(validMinimalEnv({ BCRYPT_COST: '1' })).BCRYPT_COST).toBe(1)
		})

		it('falls back to default on invalid values (tolerant)', () => {
			expect(parseEnv(validMinimalEnv({ BCRYPT_COST: 'abc' })).BCRYPT_COST).toBe(12)
			expect(parseEnv(validMinimalEnv({ BCRYPT_COST: '-3' })).BCRYPT_COST).toBe(12)
		})
	})

	describe('APP_LANGUAGE', () => {
		it('defaults to "en"', () => {
			expect(parseEnv(validMinimalEnv()).APP_LANGUAGE).toBe('en')
		})
	})

	describe('AUTH_MAX_FAILED_ATTEMPTS', () => {
		it('defaults to 5', () => {
			expect(parseEnv(validMinimalEnv()).AUTH_MAX_FAILED_ATTEMPTS).toBe(5)
		})

		it('coerces a valid positive integer', () => {
			expect(parseEnv(validMinimalEnv({ AUTH_MAX_FAILED_ATTEMPTS: '10' })).AUTH_MAX_FAILED_ATTEMPTS).toBe(10)
		})

		it('falls back to default on zero or negative', () => {
			expect(parseEnv(validMinimalEnv({ AUTH_MAX_FAILED_ATTEMPTS: '0' })).AUTH_MAX_FAILED_ATTEMPTS).toBe(5)
			expect(parseEnv(validMinimalEnv({ AUTH_MAX_FAILED_ATTEMPTS: '-3' })).AUTH_MAX_FAILED_ATTEMPTS).toBe(5)
		})

		it('falls back to default on non-numeric', () => {
			expect(parseEnv(validMinimalEnv({ AUTH_MAX_FAILED_ATTEMPTS: 'abc' })).AUTH_MAX_FAILED_ATTEMPTS).toBe(5)
		})
	})

	describe('AUTH_LOCKOUT_DURATION', () => {
		it('defaults to "15m"', () => {
			expect(parseEnv(validMinimalEnv()).AUTH_LOCKOUT_DURATION).toBe('15m')
		})

		it('uses a valid duration string', () => {
			expect(parseEnv(validMinimalEnv({ AUTH_LOCKOUT_DURATION: '30m' })).AUTH_LOCKOUT_DURATION).toBe('30m')
		})

		it('falls back to default on invalid duration string', () => {
			expect(parseEnv(validMinimalEnv({ AUTH_LOCKOUT_DURATION: 'not-a-duration' })).AUTH_LOCKOUT_DURATION).toBe('15m')
		})
	})

	describe('optional pass-through fields', () => {
		it('CRON_SECRET / TOKEN_CLEANUP_* / PG_TEST_CONNECTION_STRING / INTEGRATION_TEST_ADMIN_PASSWORD are undefined by default', () => {
			const env = parseEnv(validMinimalEnv())
			expect(env.CRON_SECRET).toBeUndefined()
			expect(env.TOKEN_CLEANUP_INTERVAL).toBeUndefined()
			expect(env.TOKEN_CLEANUP_BATCH_SIZE).toBeUndefined()
			expect(env.TOKEN_CLEANUP_MAX_BATCH_COUNT).toBeUndefined()
			expect(env.PG_TEST_CONNECTION_STRING).toBeUndefined()
			expect(env.INTEGRATION_TEST_ADMIN_PASSWORD).toBeUndefined()
		})

		it('pass through raw string values when set', () => {
			const env = parseEnv(
				validMinimalEnv({
					CRON_SECRET: 'abc',
					TOKEN_CLEANUP_BATCH_SIZE: '500',
					TOKEN_CLEANUP_MAX_BATCH_COUNT: '50',
					TOKEN_CLEANUP_INTERVAL: '6h',
				}),
			)
			expect(env.CRON_SECRET).toBe('abc')
			expect(env.TOKEN_CLEANUP_BATCH_SIZE).toBe('500')
			expect(env.TOKEN_CLEANUP_MAX_BATCH_COUNT).toBe('50')
			expect(env.TOKEN_CLEANUP_INTERVAL).toBe('6h')
		})
	})

	describe('Env type', () => {
		it('is assignable from a parseEnv result', () => {
			const result: Env = parseEnv(validMinimalEnv())
			expect(result.PG_CONNECTION_STRING).toBeDefined()
		})
	})
})

describe('env singleton + isServerless', () => {
	it('exposes a frozen env populated from process.env (set by test-setup.ts)', async () => {
		const { env, isServerless } = await import('./env')
		expect(Object.isFrozen(env)).toBe(true)
		expect(env.PASETO_SECRET_KEY).toBeDefined()
		expect(env.PG_CONNECTION_STRING).toBeDefined()
		expect(typeof isServerless()).toBe('boolean')
		expect(isServerless()).toBe(env.IS_SERVERLESS)
	})
})
