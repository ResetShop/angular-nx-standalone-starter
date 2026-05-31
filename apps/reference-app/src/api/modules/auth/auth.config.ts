import { authEnv, type AuthEnv } from '../../config/auth.env'

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
	/** Bearer secret authorizing scheduled cron-job invocations (e.g. token cleanup). Undefined when unset. */
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
 * Maps the validated `authEnv` fields onto the typed {@link AuthConfig} shape.
 *
 * The optional `source` parameter (defaulting to the lazy `authEnv` proxy) lets specs drive the
 * mapping from a `parseAuthEnv({...})` result without env mutation. All fields are already at
 * their final types after Zod parsing (booleans, numbers, validated duration strings), so no
 * per-field coercion is needed here.
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
