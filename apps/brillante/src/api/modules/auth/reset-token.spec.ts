import { clearAllMocks } from '@resetshop/util/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { seedHttpEnv } from '../../config/http.env'
import { buildPasswordResetUrl, generateResetToken, hashResetToken } from './reset-token'

describe('reset token helpers', () => {
	beforeEach(() => {
		clearAllMocks()
		seedHttpEnv({ CORS_ORIGIN: 'https://app.test/, https://other.test' })
	})

	it('generates distinct URL-safe tokens of 256 bits', () => {
		const tokens = new Set(Array.from({ length: 20 }, () => generateResetToken()))

		expect(tokens.size).toBe(20)
		for (const token of tokens) {
			expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
		}
	})

	it('hashes a token to a stable SHA-256 hex digest that is not the token', () => {
		const hash = hashResetToken('raw-token')

		expect(hash).toBe(hashResetToken('raw-token'))
		expect(hash).toMatch(/^[0-9a-f]{64}$/)
		expect(hash).not.toContain('raw-token')
		expect(hashResetToken('another')).not.toBe(hash)
	})

	it('builds the link from the first configured origin without a trailing slash', () => {
		expect(buildPasswordResetUrl('abc')).toBe('https://app.test/auth/reset-password/confirm?token=abc')
	})

	it('encodes the token in the link', () => {
		expect(buildPasswordResetUrl('a b/c')).toBe('https://app.test/auth/reset-password/confirm?token=a%20b%2Fc')
	})
})
