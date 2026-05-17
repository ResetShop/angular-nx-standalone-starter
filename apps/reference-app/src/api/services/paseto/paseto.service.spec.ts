import { clearAllMocks } from '@resetshop/util/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { type PasetoConfig } from './paseto.config'
import { PasetoService } from './paseto.service'

const KEY_A = 'a'.repeat(64)
const KEY_B = 'b'.repeat(64)

function buildConfig(overrides: Partial<PasetoConfig> = {}): PasetoConfig {
	return {
		secretKey: Buffer.from(KEY_A, 'hex'),
		issuer: 'Test Issuer',
		accessTokenExpiry: '15m',
		refreshTokenExpiry: '7d',
		clockTolerance: '1m',
		...overrides,
	}
}

describe('PasetoService', () => {
	let pasetoService: PasetoService

	const testPayload = {
		sub: '1',
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
	}

	beforeEach(() => {
		clearAllMocks()
		pasetoService = new PasetoService({ pasetoConfig: buildConfig() })
	})

	describe('constructor', () => {
		it('accepts a valid configuration', () => {
			expect(() => new PasetoService({ pasetoConfig: buildConfig() })).not.toThrow()
		})
	})

	describe('generateAccessToken', () => {
		it('should generate a PASETO v3.local token string', async () => {
			const token = await pasetoService.generateAccessToken(testPayload)

			expect(token).toMatch(/^v3\.local\./)
		})

		it('should generate different tokens for different payloads', async () => {
			const token1 = await pasetoService.generateAccessToken(testPayload)
			const token2 = await pasetoService.generateAccessToken({ ...testPayload, sub: '2' })

			expect(token1).not.toBe(token2)
		})
	})

	describe('generateRefreshToken', () => {
		it('should generate a PASETO v3.local token string', async () => {
			const token = await pasetoService.generateRefreshToken('1')

			expect(token).toMatch(/^v3\.local\./)
		})

		it('should accept an optional token family', async () => {
			const token = await pasetoService.generateRefreshToken('1', 'family-uuid')

			expect(token).toMatch(/^v3\.local\./)
		})

		it('should generate different tokens for the same userId', async () => {
			const token1 = await pasetoService.generateRefreshToken('1')
			const token2 = await pasetoService.generateRefreshToken('1')

			expect(token1).not.toBe(token2)
		})
	})

	describe('verifyAccessToken', () => {
		it('should verify and return the payload of a valid token', async () => {
			const token = await pasetoService.generateAccessToken(testPayload)

			const result = await pasetoService.verifyAccessToken(token)

			expect(result.sub).toBe(testPayload.sub)
			expect(result.email).toBe(testPayload.email)
			expect(result.firstName).toBe(testPayload.firstName)
			expect(result.lastName).toBe(testPayload.lastName)
		})

		it('should include issuer claim in verified payload', async () => {
			const token = await pasetoService.generateAccessToken(testPayload)

			const result = await pasetoService.verifyAccessToken(token)

			expect(result.iss).toBe('Test Issuer')
		})

		it('should throw for a tampered token', async () => {
			const token = await pasetoService.generateAccessToken(testPayload)
			const tampered = token.slice(0, -5) + 'XXXXX'

			await expect(pasetoService.verifyAccessToken(tampered)).rejects.toThrow('Invalid or expired token')
		})

		it('should throw for a completely invalid token string', async () => {
			await expect(pasetoService.verifyAccessToken('not-a-token')).rejects.toThrow('Invalid or expired token')
		})

		it('should reject a token generated with a different key', async () => {
			const token = await pasetoService.generateAccessToken(testPayload)
			const otherService = new PasetoService({
				pasetoConfig: buildConfig({ secretKey: Buffer.from(KEY_B, 'hex') }),
			})

			await expect(otherService.verifyAccessToken(token)).rejects.toThrow('Invalid or expired token')
		})

		it('should reject a token with wrong issuer', async () => {
			const serviceA = new PasetoService({ pasetoConfig: buildConfig({ issuer: 'Issuer A' }) })
			const token = await serviceA.generateAccessToken(testPayload)

			const serviceB = new PasetoService({ pasetoConfig: buildConfig({ issuer: 'Issuer B' }) })

			await expect(serviceB.verifyAccessToken(token)).rejects.toThrow('Invalid or expired token')
		})
	})

	describe('verifyRefreshToken', () => {
		it('should verify and return the payload of a valid refresh token', async () => {
			const token = await pasetoService.generateRefreshToken('42', 'test-family')

			const result = await pasetoService.verifyRefreshToken(token)

			expect(result.sub).toBe('42')
			expect(result.tokenFamily).toBe('test-family')
		})

		it('should throw for a tampered refresh token', async () => {
			const token = await pasetoService.generateRefreshToken('1')
			const tampered = token.slice(0, -5) + 'XXXXX'

			await expect(pasetoService.verifyRefreshToken(tampered)).rejects.toThrow('Invalid or expired refresh token')
		})

		it('should throw for a completely invalid token string', async () => {
			await expect(pasetoService.verifyRefreshToken('not-a-token')).rejects.toThrow('Invalid or expired refresh token')
		})

		it('should reject a refresh token generated with a different key', async () => {
			const token = await pasetoService.generateRefreshToken('1')
			const otherService = new PasetoService({
				pasetoConfig: buildConfig({ secretKey: Buffer.from(KEY_B, 'hex') }),
			})

			await expect(otherService.verifyRefreshToken(token)).rejects.toThrow('Invalid or expired refresh token')
		})

		it('should reject a refresh token with wrong issuer', async () => {
			const serviceA = new PasetoService({ pasetoConfig: buildConfig({ issuer: 'Issuer A' }) })
			const token = await serviceA.generateRefreshToken('1')

			const serviceB = new PasetoService({ pasetoConfig: buildConfig({ issuer: 'Issuer B' }) })

			await expect(serviceB.verifyRefreshToken(token)).rejects.toThrow('Invalid or expired refresh token')
		})

		it('should generate a token family UUID when none is provided', async () => {
			const token = await pasetoService.generateRefreshToken('1')

			const result = await pasetoService.verifyRefreshToken(token)

			expect(result.tokenFamily).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
		})
	})
})
