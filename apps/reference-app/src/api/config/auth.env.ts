/**
 * Auth env sub-schema.
 *
 * Covers PASETO secrets and token expiries, account-lockout policy, the bcrypt
 * cost factor, the cron-job bearer secret, and the cookie security flag. This
 * module is self-contained — it has no dependency on any other env sub-module —
 * so consumers that only need auth config (PasetoService, AuthConfig, the
 * cleanup-tokens controller, the user-management service's password hashing)
 * import from here without triggering validation for unrelated domains.
 *
 * Every backend file that needs an auth env var must import `authEnv` from here
 * (or `parseAuthEnv` / `seedAuthEnv` for tests). Direct `process.env[...]`
 * access is ESLint-forbidden everywhere except files matching `*.env.ts`.
 */
import { parseDurationToMs } from '@resetshop/util'
import { z } from 'zod'
import {
	DEFAULT_ACCESS_TOKEN_EXPIRY,
	DEFAULT_LOCKOUT_DURATION,
	DEFAULT_MAX_FAILED_ATTEMPTS,
	DEFAULT_REFRESH_TOKEN_EXPIRY,
} from '../constants/auth.constants'
import { formatZodError } from './env-utils'

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
	BCRYPT_COST: z.coerce.number().int().positive().default(DEFAULT_BCRYPT_COST).catch(DEFAULT_BCRYPT_COST),
	CRON_SECRET: z.string().optional(),
})

export type AuthEnv = z.infer<typeof AuthEnvSchema>

export function parseAuthEnv(rawEnv: NodeJS.ProcessEnv): AuthEnv {
	return AuthEnvSchema.parse(rawEnv)
}

let cachedAuthEnv: Readonly<AuthEnv> | null = null

function initializeAuthEnv(): Readonly<AuthEnv> {
	if (cachedAuthEnv !== null) return cachedAuthEnv
	try {
		cachedAuthEnv = Object.freeze(parseAuthEnv(process.env))
		return cachedAuthEnv
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('FATAL: Environment validation failed (auth domain):')
			console.error(formatZodError(error))
			console.error('\nSee docs/environment-variables.md for the required variables and delivery options.')
			process.exit(1)
		}
		throw error
	}
}

// REASON: Proxy traps intercept all property access; the target is never read directly.
export const authEnv: Readonly<AuthEnv> = new Proxy({} as AuthEnv, {
	get(_target, prop) {
		return initializeAuthEnv()[prop as keyof AuthEnv]
	},
	has(_target, prop) {
		return prop in initializeAuthEnv()
	},
})

// ─── Test helpers ─────────────────────────────────────────────────────────────

const AUTH_ENV_TEST_DEFAULTS: NodeJS.ProcessEnv = {
	PASETO_SECRET_KEY: '0123456789abcdef'.repeat(4), // 32 bytes = 64 hex chars
	PASETO_ISSUER: 'test-issuer',
}

/**
 * Test seeder for the auth sub-schema. See `seedDbEnv` for the rationale —
 * writes directly to the module-level cache so tests don't need to mutate
 * `process.env`.
 */
export function seedAuthEnv(overrides: Partial<Record<keyof AuthEnv, string>> = {}): void {
	cachedAuthEnv = Object.freeze(parseAuthEnv({ ...AUTH_ENV_TEST_DEFAULTS, ...overrides }))
}

/** Clear the cached `authEnv` so the next property access re-parses `process.env`. */
export function resetAuthEnv(): void {
	cachedAuthEnv = null
}
