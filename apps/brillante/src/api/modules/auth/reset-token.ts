import { createHash, randomBytes } from 'crypto'
import { PASSWORD_RESET_PATH } from '../../constants/auth.constants'
import { buildAppUrl } from '../../helpers/app-url'

/** A new single-use reset token: 256 bits from the system CSPRNG, URL-safe. Only its hash is ever stored. */
export function generateResetToken(): string {
	return randomBytes(32).toString('base64url')
}

/** The value stored (and looked up) for a raw reset token. */
export function hashResetToken(token: string): string {
	return createHash('sha256').update(token).digest('hex')
}

/**
 * The link that completes a reset, on the app's public origin (see `appOrigin`).
 */
export function buildPasswordResetUrl(rawToken: string): string {
	return `${buildAppUrl(PASSWORD_RESET_PATH)}?token=${encodeURIComponent(rawToken)}`
}
