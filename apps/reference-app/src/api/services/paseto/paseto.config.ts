import { env } from '@config/env'

/**
 * Frozen config consumed by `PasetoService`. All values flow from the validated
 * env contract through the DI container, so `PasetoService` itself has no env
 * coupling and is trivially testable with a literal config.
 */
export interface PasetoConfig {
	/** 32-byte PASETO v3.local key, decoded from the validated hex `PASETO_SECRET_KEY`. */
	secretKey: Buffer
	/** Token issuer claim (`PASETO_ISSUER`). */
	issuer: string
	/** Access-token expiry duration string (e.g. '15m'). */
	accessTokenExpiry: string
	/** Refresh-token expiry duration string (e.g. '7d'). */
	refreshTokenExpiry: string
	/** Allowed clock drift for verification (e.g. '1m'). */
	clockTolerance: string
}

export function createPasetoConfig(): PasetoConfig {
	return Object.freeze({
		secretKey: Buffer.from(env.PASETO_SECRET_KEY, 'hex'),
		issuer: env.PASETO_ISSUER,
		accessTokenExpiry: env.PASETO_ACCESS_TOKEN_EXPIRY,
		refreshTokenExpiry: env.PASETO_REFRESH_TOKEN_EXPIRY,
		clockTolerance: env.PASETO_CLOCK_TOLERANCE,
	})
}
