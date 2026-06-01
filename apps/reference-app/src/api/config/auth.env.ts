/**
 * Auth env sub-schema.
 *
 * Covers PASETO secrets and token expiries, account-lockout policy, the
 * change-password rate-limit overrides, the bcrypt cost factor, the cron-job
 * bearer secret, and the cookie security flag.
 * Self-contained — no dependency on any other env sub-module — so services that
 * only need auth config (PasetoService, AuthConfig, the cleanup-tokens
 * controller, the change-password rate limiter, the user-management service's
 * password hashing) import from here without triggering validation for unrelated
 * domains.
 *
 * Consumers must import `authEnv` (or `parseAuthEnv` / `seedAuthEnv` for tests).
 * Direct `process.env[...]` access is ESLint-forbidden everywhere except files
 * matching `*.env.ts`.
 */
import { parseDurationToMs } from '@resetshop/util'
import { z } from 'zod'
import {
	DEFAULT_ACCESS_TOKEN_EXPIRY,
	DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_MAX,
	DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_WINDOW,
	DEFAULT_LOCKOUT_DURATION,
	DEFAULT_MAX_FAILED_ATTEMPTS,
	DEFAULT_REFRESH_TOKEN_EXPIRY,
} from '../constants/auth.constants'
import { createEnvHandler } from './env-utils'

const DEFAULT_CLOCK_TOLERANCE = '1m'
const DEFAULT_BCRYPT_COST = 12

function isValidDuration(value: string): boolean {
	try {
		parseDurationToMs(value)
		return true
	} catch {
		return false
	}
}

const AuthEnvSchema = z.object({
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
	COOKIE_SECURE: z
		.string()
		.optional()
		.transform((v) => v !== 'false'),
	AUTH_MAX_FAILED_ATTEMPTS: z.coerce
		.number()
		.int()
		.positive()
		.default(DEFAULT_MAX_FAILED_ATTEMPTS)
		.catch(DEFAULT_MAX_FAILED_ATTEMPTS),
	AUTH_LOCKOUT_DURATION: z
		.string()
		.optional()
		.transform((v) => {
			if (!v) return DEFAULT_LOCKOUT_DURATION
			return isValidDuration(v) ? v : DEFAULT_LOCKOUT_DURATION
		}),
	AUTH_CHANGE_PASSWORD_RATE_LIMIT_WINDOW: z
		.string()
		.optional()
		.transform((v) => {
			if (!v) return DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_WINDOW
			return isValidDuration(v) ? v : DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_WINDOW
		}),
	AUTH_CHANGE_PASSWORD_RATE_LIMIT_MAX: z.coerce
		.number()
		.int()
		.positive()
		.default(DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_MAX)
		.catch(DEFAULT_CHANGE_PASSWORD_RATE_LIMIT_MAX),
	BCRYPT_COST: z.coerce.number().int().positive().default(DEFAULT_BCRYPT_COST).catch(DEFAULT_BCRYPT_COST),
	CRON_SECRET: z.string().optional(),
})

export type AuthEnv = z.infer<typeof AuthEnvSchema>

const handler = createEnvHandler('auth', AuthEnvSchema, {
	PASETO_SECRET_KEY: '0123456789abcdef'.repeat(4), // 32 bytes = 64 hex chars
	PASETO_ISSUER: 'test-issuer',
})

export const parseAuthEnv = handler.parse
export const authEnv = handler.proxy
export const seedAuthEnv = handler.seed
export const resetAuthEnv = handler.reset
