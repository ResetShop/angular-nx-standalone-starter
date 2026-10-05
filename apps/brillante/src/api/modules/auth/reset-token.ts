import { createHash, randomBytes } from 'crypto'
import { httpEnv } from '../../config/http.env'
import { PASSWORD_RESET_PATH } from '../../constants/auth.constants'

/** A new single-use reset token: 256 bits from the system CSPRNG, URL-safe. Only its hash is ever stored. */
export function generateResetToken(): string {
	return randomBytes(32).toString('base64url')
}

/** The value stored (and looked up) for a raw reset token. */
export function hashResetToken(token: string): string {
	return createHash('sha256').update(token).digest('hex')
}

/**
 * The link that completes a reset. `httpEnv.CORS_ORIGIN` is the configured frontend origin; when it is a
 * comma-separated list the first origin is used, and a trailing slash is dropped.
 */
export function buildPasswordResetUrl(rawToken: string): string {
	const origin = httpEnv.CORS_ORIGIN.split(',')[0].trim().replace(/\/$/, '')
	return `${origin}${PASSWORD_RESET_PATH}?token=${encodeURIComponent(rawToken)}`
}
