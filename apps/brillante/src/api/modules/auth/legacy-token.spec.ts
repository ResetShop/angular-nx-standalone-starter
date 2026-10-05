import { createHmac, timingSafeEqual } from 'crypto'
import { describe, expect, it } from 'vitest'
import { signLegacyToken } from './legacy-token'

const SECRET = 'placeholder-legacy-secret-for-tests-only'
const NOW = new Date('2026-10-05T12:00:00.000Z')

/**
 * Independent re-implementation of what the legacy middleware does with a token (express-jwt 5 over jsonwebtoken 8):
 * check the HS256 signature with the shared secret, then the `exp` claim.
 */
function verifyLikeTheLegacyApi(token: string, secret: string, at: Date): Record<string, unknown> | null {
	const [header, payload, signature] = token.split('.')
	const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest()
	const actual = Buffer.from(signature, 'base64url')
	if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
	if (JSON.parse(Buffer.from(header, 'base64url').toString()).alg !== 'HS256') return null
	const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Record<string, unknown>
	return typeof claims['exp'] === 'number' && claims['exp'] <= Math.floor(at.getTime() / 1000) ? null : claims
}

describe('signLegacyToken', () => {
	it('signs an HS256 token whose sub is the numeric user id, as the legacy authenticate does', () => {
		const { token } = signLegacyToken(7, SECRET, '1h', NOW)

		expect(verifyLikeTheLegacyApi(token, SECRET, NOW)).toMatchObject({ sub: 7 })
		const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString())
		expect(header).toEqual({ alg: 'HS256', typ: 'JWT' })
	})

	it('adds the issue and expiry times from the lifetime', () => {
		const { token, expiresAt } = signLegacyToken(7, SECRET, '1h', NOW)

		const claims = verifyLikeTheLegacyApi(token, SECRET, NOW)
		expect(claims).toMatchObject({ iat: 1791201600, exp: 1791205200 })
		expect(expiresAt).toEqual(new Date('2026-10-05T13:00:00.000Z'))
	})

	it('is rejected once it has expired', () => {
		const { token } = signLegacyToken(7, SECRET, '1h', NOW)

		expect(verifyLikeTheLegacyApi(token, SECRET, new Date('2026-10-05T13:00:00.000Z'))).toBeNull()
	})

	it('is rejected under another secret or after tampering with the claims', () => {
		const { token } = signLegacyToken(7, SECRET, '1h', NOW)
		const [header, , signature] = token.split('.')
		const forgedPayload = Buffer.from(JSON.stringify({ sub: 1, exp: 9999999999 })).toString('base64url')

		expect(verifyLikeTheLegacyApi(token, 'a-different-secret-of-sufficient-length', NOW)).toBeNull()
		expect(verifyLikeTheLegacyApi(`${header}.${forgedPayload}.${signature}`, SECRET, NOW)).toBeNull()
	})

	it('produces a URL-safe token with three segments', () => {
		expect(signLegacyToken(1000, SECRET, '15m', NOW).token).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/)
	})
})
