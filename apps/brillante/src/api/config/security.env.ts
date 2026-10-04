/**
 * Account-security env sub-schema.
 *
 * Covers the login-lockout policy (`AUTH_MAX_FAILED_ATTEMPTS`,
 * `AUTH_LOCKOUT_DURATION`). All fields are optional with safe defaults, so
 * `parseSecurityEnv({})` succeeds — this schema has no required fields and is
 * therefore importable in any context without triggering a FATAL. Per-IP rate
 * limits are not configured here: they are Cloudflare Rate Limiting bindings
 * declared in `wrangler.jsonc` (see `rate-limit.middleware.ts`).
 *
 * Consumers must import `securityEnv` (or `parseSecurityEnv` / `seedSecurityEnv`
 * for tests). Direct `process.env[...]` access is ESLint-forbidden everywhere
 * except files matching `*.env.ts`.
 */
import { parseDurationToMs } from '@resetshop/util'
import { z } from 'zod'
import { DEFAULT_LOCKOUT_DURATION, DEFAULT_MAX_FAILED_ATTEMPTS } from '../constants/auth.constants'
import { createEnvHandler } from './env-utils'

function isValidDuration(value: string): boolean {
	try {
		parseDurationToMs(value)
		return true
	} catch {
		return false
	}
}

const SecurityEnvSchema = z.object({
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
})

export type SecurityEnv = z.infer<typeof SecurityEnvSchema>

// Empty — every field is optional with a safe default, so `parseSecurityEnv({})`
// succeeds. Kept for structural symmetry with the other sub-schemas.
const handler = createEnvHandler('security', SecurityEnvSchema, {})

export const parseSecurityEnv = handler.parse
export const securityEnv = handler.proxy
export const seedSecurityEnv = handler.seed
export const resetSecurityEnv = handler.reset
