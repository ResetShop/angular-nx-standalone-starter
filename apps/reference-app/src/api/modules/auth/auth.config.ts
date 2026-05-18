import { authEnv, type AuthEnv } from '@config/auth.env'

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
 * Builds the frozen auth config object from the validated auth env contract.
 * All defaults and tolerant parsing live in `@config/auth.env`; this function is
 * a thin re-shape that exposes auth-specific field names to consumers.
 *
 * The `source` parameter defaults to the singleton `authEnv` so production
 * callers have zero-arg ergonomics. Tests pass a custom `AuthEnv` (built via
 * `parseAuthEnv`) to verify the key-to-field mapping without mutating
 * `process.env`.
 */
export function createAuthConfig(source: AuthEnv = authEnv): AuthConfig {
	return Object.freeze({
		cookieSecure: source.COOKIE_SECURE,
		accessTokenExpiry: source.PASETO_ACCESS_TOKEN_EXPIRY,
		refreshTokenExpiry: source.PASETO_REFRESH_TOKEN_EXPIRY,
		maxFailedAttempts: source.AUTH_MAX_FAILED_ATTEMPTS,
		lockoutDuration: source.AUTH_LOCKOUT_DURATION,
		cronSecret: source.CRON_SECRET,
	})
}
