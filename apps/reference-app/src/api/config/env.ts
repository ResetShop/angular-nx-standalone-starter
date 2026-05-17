/**
 * Single source of truth for environment variables.
 *
 * Every production-code consumer of an env var must import the parsed `env`
 * object from this module. Direct `process.env[...]` access is ESLint-forbidden
 * everywhere except this file. See `docs/environment-variables.md` for the
 * variable reference and the four supported delivery options.
 */
import { parseDurationToMs, parseDurationToSeconds } from '@resetshop/util'
import { z } from 'zod'
import {
	DEFAULT_ACCESS_TOKEN_EXPIRY,
	DEFAULT_LOCKOUT_DURATION,
	DEFAULT_MAX_FAILED_ATTEMPTS,
	DEFAULT_REFRESH_TOKEN_EXPIRY,
} from '../constants/auth.constants'

// File-local defaults that aren't shared elsewhere — kept here so callers
// always read the resolved value via `env`, not the default constant.
const DEFAULT_CLOCK_TOLERANCE = '1m'
const DEFAULT_BCRYPT_COST = 12
const DEFAULT_SMTP_PORT = 587
const DEFAULT_SMTP_FROM = 'noreply@example.com'
const DEFAULT_CORS_ORIGIN = 'http://localhost:4200'
const DEFAULT_CORS_MAX_AGE = parseDurationToSeconds('24h')
const DEFAULT_PORT = 4000
const DEFAULT_APP_LANGUAGE = 'en'

function isValidDuration(value: string): boolean {
	try {
		parseDurationToMs(value)
		return true
	} catch {
		return false
	}
}

const EnvSchema = z
	.object({
		NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

		// Database
		PG_CONNECTION_STRING: z.string().min(1),
		PG_TEST_CONNECTION_STRING: z.string().min(1).optional(),

		// PASETO / Auth tokens
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

		// Cookie flags
		COOKIE_SECURE: z
			.string()
			.optional()
			.transform((v) => v !== 'false'),

		// Account lockout — tolerant of invalid values (silent fallback to default)
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

		// Email transport
		EMAIL_PROVIDER: z.enum(['nodemailer', 'ethereal', 'noop']).default('nodemailer'),
		SMTP_HOST: z.string().optional(),
		SMTP_USER: z.string().optional(),
		SMTP_PASS: z.string().optional(),
		SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_SMTP_PORT),
		SMTP_SECURE: z
			.string()
			.optional()
			.transform((v) => v === 'true'),
		SMTP_FROM: z.string().default(DEFAULT_SMTP_FROM),

		// HTTP / Hosting
		BASE_HREF: z.string().optional(),
		IS_SERVERLESS: z
			.string()
			.optional()
			.transform((v) => v === 'true'),
		PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT).catch(DEFAULT_PORT),
		CORS_ORIGIN: z.string().default(DEFAULT_CORS_ORIGIN),
		CORS_MAX_AGE: z.coerce.number().int().positive().default(DEFAULT_CORS_MAX_AGE).catch(DEFAULT_CORS_MAX_AGE),

		// Password hashing / i18n
		BCRYPT_COST: z.coerce.number().int().positive().default(DEFAULT_BCRYPT_COST).catch(DEFAULT_BCRYPT_COST),
		APP_LANGUAGE: z.string().default(DEFAULT_APP_LANGUAGE),

		// Cron / Token maintenance — raw strings; clamping and warnings live at call sites
		CRON_SECRET: z.string().optional(),
		TOKEN_CLEANUP_INTERVAL: z.string().optional(),
		TOKEN_CLEANUP_BATCH_SIZE: z.string().optional(),
		TOKEN_CLEANUP_MAX_BATCH_COUNT: z.string().optional(),

		// Integration tests
		INTEGRATION_TEST_ADMIN_PASSWORD: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.EMAIL_PROVIDER !== 'nodemailer') return
		const missing: Array<'SMTP_HOST' | 'SMTP_USER' | 'SMTP_PASS'> = []
		if (!data.SMTP_HOST) missing.push('SMTP_HOST')
		if (!data.SMTP_USER) missing.push('SMTP_USER')
		if (!data.SMTP_PASS) missing.push('SMTP_PASS')
		for (const field of missing) {
			ctx.addIssue({
				code: 'custom',
				path: [field],
				message: `${field} is required when EMAIL_PROVIDER=nodemailer`,
			})
		}
	})

export type Env = z.infer<typeof EnvSchema>

/**
 * Validates the given environment object against the schema and returns
 * the parsed, typed result. Throws `z.ZodError` on failure.
 *
 * Use this in tests to exercise validation branches without mutating
 * the global `process.env`.
 */
export function parseEnv(rawEnv: NodeJS.ProcessEnv): Env {
	return EnvSchema.parse(rawEnv)
}

function formatZodError(error: z.ZodError): string {
	return error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n')
}

let cachedEnv: Readonly<Env> | null = null

function initializeEnv(): Readonly<Env> {
	if (cachedEnv !== null) return cachedEnv
	try {
		cachedEnv = Object.freeze(parseEnv(process.env))
		return cachedEnv
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('FATAL: Environment validation failed:')
			console.error(formatZodError(error))
			console.error('\nSee docs/environment-variables.md for the required variables and delivery options.')
			process.exit(1)
		}
		throw error
	}
}

/**
 * Frozen `Env` populated from `process.env` on first property access.
 *
 * Initialization is deferred until first read so that bundlers and build
 * tools that import this module (e.g. the Angular SSR prerender worker)
 * can load it without env vars being set — they typically don't read any
 * env fields and so never trigger validation. Production runtime code
 * reads `env.X` at startup, which triggers validation and fails fast on
 * misconfiguration.
 */
// REASON: Proxy traps intercept all property access; the target is never read directly.
// Only `get` and `has` traps are defined — `ownKeys` / `getOwnPropertyDescriptor` traps
// would violate the Proxy invariant when reflecting the frozen cache's non-configurable
// properties through an empty target (Node throws on `Object.keys(env)` etc.).
// Callers must read specific named fields (e.g. `env.PG_CONNECTION_STRING`), never
// enumerate the proxy.
export const env: Readonly<Env> = new Proxy({} as Env, {
	get(_target, prop) {
		return initializeEnv()[prop as keyof Env]
	},
	has(_target, prop) {
		return prop in initializeEnv()
	},
})

/**
 * True when the app is running in a connection-pooled serverless environment.
 * Reads from the validated `env` rather than `process.env` directly.
 */
export function isServerless(): boolean {
	return env.IS_SERVERLESS
}
