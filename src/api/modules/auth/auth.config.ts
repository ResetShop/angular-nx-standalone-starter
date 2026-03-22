import { parseDurationToMs } from '@utils/duration'
import {
	DEFAULT_ACCESS_TOKEN_EXPIRY,
	DEFAULT_LOCKOUT_DURATION,
	DEFAULT_MAX_FAILED_ATTEMPTS,
	DEFAULT_REFRESH_TOKEN_EXPIRY,
} from '../../constants/auth.constants'

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
}

/**
 * Reads and validates auth-related environment variables at startup.
 * Returns a frozen config object suitable for injection into services and repositories.
 */
export function createAuthConfig(): AuthConfig {
	return Object.freeze({
		// WARNING: COOKIE_SECURE=false must ONLY be used in local development (no HTTPS).
		// In production, omit the variable entirely — it defaults to true (HTTPS required).
		cookieSecure: process.env['COOKIE_SECURE'] !== 'false',
		accessTokenExpiry: process.env['PASETO_ACCESS_TOKEN_EXPIRY'] ?? DEFAULT_ACCESS_TOKEN_EXPIRY,
		refreshTokenExpiry: process.env['PASETO_REFRESH_TOKEN_EXPIRY'] ?? DEFAULT_REFRESH_TOKEN_EXPIRY,
		maxFailedAttempts: parseMaxFailedAttempts(process.env['AUTH_MAX_FAILED_ATTEMPTS']),
		lockoutDuration: parseLockoutDuration(process.env['AUTH_LOCKOUT_DURATION']),
	})
}

function parseMaxFailedAttempts(value: string | undefined): number {
	const parsed = parseInt(value ?? '', 10)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_FAILED_ATTEMPTS
}

function parseLockoutDuration(value: string | undefined): string {
	if (!value) return DEFAULT_LOCKOUT_DURATION
	try {
		parseDurationToMs(value) // validate the format
		return value
	} catch {
		return DEFAULT_LOCKOUT_DURATION
	}
}
