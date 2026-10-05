/**
 * Token / session env sub-schema.
 *
 * Covers PASETO secrets, token expiries, the clock tolerance, and the cookie
 * security flag — everything needed to issue and validate authentication tokens
 * and to set the auth cookies. `PASETO_SECRET_KEY` and `PASETO_ISSUER` are the
 * only required-without-default fields in the whole env contract, so isolating
 * them here means contexts that need only hashing, lockout, or cron config (e.g.
 * the seed script, the SSR prerender worker) never trigger PASETO validation.
 *
 * Consumers must import `tokenEnv` (or `parseTokenEnv` / `seedTokenEnv` for tests).
 * Direct `process.env[...]` access is ESLint-forbidden everywhere except files
 * matching `*.env.ts`.
 */
import { parseDurationToMs } from '@resetshop/util'
import { z } from 'zod'
import {
	DEFAULT_ACCESS_TOKEN_EXPIRY,
	DEFAULT_LEGACY_TOKEN_EXPIRY,
	DEFAULT_REFRESH_TOKEN_EXPIRY,
} from '../constants/auth.constants'
import { createEnvHandler } from './env-utils'

const DEFAULT_CLOCK_TOLERANCE = '1m'

function isDuration(value: string): boolean {
	try {
		parseDurationToMs(value)
		return true
	} catch {
		return false
	}
}

const TokenEnvSchema = z.object({
	PASETO_SECRET_KEY: z
		.string()
		.regex(
			/^[0-9a-fA-F]{64,}$/,
			'PASETO_SECRET_KEY must be at least 32 bytes (64 hex characters). Generate with: openssl rand -hex 32',
		),
	PASETO_ISSUER: z.string().min(1),
	PASETO_ACCESS_TOKEN_EXPIRY: z.string().min(1).default(DEFAULT_ACCESS_TOKEN_EXPIRY),
	PASETO_REFRESH_TOKEN_EXPIRY: z.string().min(1).default(DEFAULT_REFRESH_TOKEN_EXPIRY),
	PASETO_CLOCK_TOLERANCE: z.string().min(1).default(DEFAULT_CLOCK_TOLERANCE),
	// Shared HS256 secret of the legacy API. Its length is whatever the legacy server uses, so only a blank value is
	// refused; surrounding whitespace (a pasted newline) is dropped. A blank or missing value reads as unset: the
	// legacy-token endpoint then answers 503, and a bad value here can never take the PASETO login down with it.
	LEGACY_JWT_SECRET: z.string().trim().min(1).optional().catch(undefined),
	// A value that is not a duration string falls back to the default for the same reason.
	LEGACY_JWT_EXPIRY: z
		.string()
		.refine(isDuration)
		.default(DEFAULT_LEGACY_TOKEN_EXPIRY)
		.catch(DEFAULT_LEGACY_TOKEN_EXPIRY),
	COOKIE_SECURE: z
		.string()
		.optional()
		.transform((v) => v !== 'false'),
})

export type TokenEnv = z.infer<typeof TokenEnvSchema>

const handler = createEnvHandler('token', TokenEnvSchema, {
	PASETO_SECRET_KEY: '0123456789abcdef'.repeat(4), // 32 bytes = 64 hex chars
	PASETO_ISSUER: 'test-issuer',
})

export const parseTokenEnv = handler.parse
export const tokenEnv = handler.proxy
export const seedTokenEnv = handler.seed
export const resetTokenEnv = handler.reset
