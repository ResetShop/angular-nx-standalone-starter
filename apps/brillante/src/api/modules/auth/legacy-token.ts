import { parseDurationToMs } from '@resetshop/util'
import { createHmac } from 'crypto'

/**
 * Signs the token the legacy API validates: HS256 with the legacy shared secret and `sub` set to the numeric user id,
 * exactly the claim the legacy `/users/authenticate` signs. `iat` and `exp` are added; the legacy middleware
 * (express-jwt) rejects an expired token, so this is stricter than the legacy tokens, which never expire.
 */
export function signLegacyToken(
	userId: number,
	secret: string,
	expiresIn: string,
	now: Date = new Date(),
): { token: string; expiresAt: Date } {
	const encode = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url')
	const issuedAt = Math.floor(now.getTime() / 1000)
	// Whole seconds, so the returned expiry is exactly the token's exp claim.
	const expiresAt = new Date(Math.floor((now.getTime() + parseDurationToMs(expiresIn)) / 1000) * 1000)
	const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, iat: issuedAt, exp: Math.floor(expiresAt.getTime() / 1000) })}`
	const signature = createHmac('sha256', secret).update(unsigned).digest('base64url')
	return { token: `${unsigned}.${signature}`, expiresAt }
}
