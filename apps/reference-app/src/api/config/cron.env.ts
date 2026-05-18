/**
 * Cron / token-maintenance env sub-schema.
 *
 * All three fields are raw `z.string().optional()` — clamping, default fallback,
 * and warning logs live at the call sites (`refresh-token.repository.ts` and
 * `cron-jobs.ts`) because the bounds (e.g. `1m`–`7d` for the interval, 100–10000
 * for the batch size) are business-logic concerns, not schema validation.
 *
 * Every backend file that needs a cron env var must import `cronEnv` from
 * here (or `parseCronEnv` / `seedCronEnv` for tests). Direct `process.env`
 * access is ESLint-forbidden everywhere except files matching `*.env.ts`.
 */
import { z } from 'zod'

const CronEnvSchema = z.object({
	TOKEN_CLEANUP_INTERVAL: z.string().optional(),
	TOKEN_CLEANUP_BATCH_SIZE: z.string().optional(),
	TOKEN_CLEANUP_MAX_BATCH_COUNT: z.string().optional(),
})

export type CronEnv = z.infer<typeof CronEnvSchema>

export function parseCronEnv(rawEnv: NodeJS.ProcessEnv): CronEnv {
	return CronEnvSchema.parse(rawEnv)
}

function formatZodError(error: z.ZodError): string {
	return error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n')
}

let cachedCronEnv: Readonly<CronEnv> | null = null

function initializeCronEnv(): Readonly<CronEnv> {
	if (cachedCronEnv !== null) return cachedCronEnv
	try {
		cachedCronEnv = Object.freeze(parseCronEnv(process.env))
		return cachedCronEnv
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('FATAL: Environment validation failed (cron domain):')
			console.error(formatZodError(error))
			console.error('\nSee docs/environment-variables.md for the required variables and delivery options.')
			process.exit(1)
		}
		throw error
	}
}

// REASON: Proxy traps intercept all property access; the target is never read directly.
export const cronEnv: Readonly<CronEnv> = new Proxy({} as CronEnv, {
	get(_target, prop) {
		return initializeCronEnv()[prop as keyof CronEnv]
	},
	has(_target, prop) {
		return prop in initializeCronEnv()
	},
})

// ─── Test helpers ─────────────────────────────────────────────────────────────

const CRON_ENV_TEST_DEFAULTS: NodeJS.ProcessEnv = {}

export function seedCronEnv(overrides: Partial<Record<keyof CronEnv, string>> = {}): void {
	cachedCronEnv = Object.freeze(parseCronEnv({ ...CRON_ENV_TEST_DEFAULTS, ...overrides }))
}

export function resetCronEnv(): void {
	cachedCronEnv = null
}
