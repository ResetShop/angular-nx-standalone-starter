import { env } from '@config/env'

export interface AuthConfig {
	/** Whether cookies require HTTPS. Defaults to true; set COOKIE_SECURE=false only for local dev. */
	cookieSecure: boolean
	/** Access token expiry as a duration string (e.g. '15m'). Used for cookie maxAge. */
	accessTokenExpiry: string
	/** Refresh token expiry as a duration string (e.g. '7d'). Used for cookie maxAge and DB storage. */
	refreshTokenExpiry: string
	/** Maximum failed login attempts before account lockout. */
	maxFailedAttempts: number
	/** Account lockout duration as a duration string (e.g. '15m'). Resolve via parseDurationToMs() at point of use. */
	lockoutDuration: string
	/** Shared secret for cron-job-triggered endpoints. `undefined` disables cron auth. */
	cronSecret: string | undefined
}

export function buildBaseCookieOptions(authConfig: AuthConfig) {
	return {
		httpOnly: true,
		secure: authConfig.cookieSecure,
		sameSite: 'Strict' as const,
		path: '/',
	}
}

/**
 * Builds the frozen auth config object from the validated env contract.
 * All defaults and tolerant parsing live in `@config/env`; this function is a
 * thin re-shape that exposes auth-specific field names to consumers.
 */
export function createAuthConfig(): AuthConfig {
	return Object.freeze({
		cookieSecure: env.COOKIE_SECURE,
		accessTokenExpiry: env.PASETO_ACCESS_TOKEN_EXPIRY,
		refreshTokenExpiry: env.PASETO_REFRESH_TOKEN_EXPIRY,
		maxFailedAttempts: env.AUTH_MAX_FAILED_ATTEMPTS,
		lockoutDuration: env.AUTH_LOCKOUT_DURATION,
		cronSecret: env.CRON_SECRET,
	})
}
