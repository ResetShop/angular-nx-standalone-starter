/**
 * Application env sub-schema.
 *
 * Covers cross-cutting application config: the runtime environment selector,
 * the default UI/email language, and the integration-test admin password.
 *
 * Every backend file that needs an app env var must import `appEnv` from
 * here (or `parseAppEnv` / `seedAppEnv` for tests). Direct `process.env`
 * access is ESLint-forbidden everywhere except files matching `*.env.ts`.
 */
import { z } from 'zod'

const DEFAULT_APP_LANGUAGE = 'en'

const AppEnvSchema = z.object({
	NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	APP_LANGUAGE: z.string().default(DEFAULT_APP_LANGUAGE),
	INTEGRATION_TEST_ADMIN_PASSWORD: z.string().optional(),
})

export type AppEnv = z.infer<typeof AppEnvSchema>

export function parseAppEnv(rawEnv: NodeJS.ProcessEnv): AppEnv {
	return AppEnvSchema.parse(rawEnv)
}

function formatZodError(error: z.ZodError): string {
	return error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n')
}

let cachedAppEnv: Readonly<AppEnv> | null = null

function initializeAppEnv(): Readonly<AppEnv> {
	if (cachedAppEnv !== null) return cachedAppEnv
	try {
		cachedAppEnv = Object.freeze(parseAppEnv(process.env))
		return cachedAppEnv
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('FATAL: Environment validation failed (app domain):')
			console.error(formatZodError(error))
			console.error('\nSee docs/environment-variables.md for the required variables and delivery options.')
			process.exit(1)
		}
		throw error
	}
}

// REASON: Proxy traps intercept all property access; the target is never read directly.
export const appEnv: Readonly<AppEnv> = new Proxy({} as AppEnv, {
	get(_target, prop) {
		return initializeAppEnv()[prop as keyof AppEnv]
	},
	has(_target, prop) {
		return prop in initializeAppEnv()
	},
})

// ─── Test helpers ─────────────────────────────────────────────────────────────

const APP_ENV_TEST_DEFAULTS: NodeJS.ProcessEnv = {}

export function seedAppEnv(overrides: Partial<Record<keyof AppEnv, string>> = {}): void {
	cachedAppEnv = Object.freeze(parseAppEnv({ ...APP_ENV_TEST_DEFAULTS, ...overrides }))
}

export function resetAppEnv(): void {
	cachedAppEnv = null
}
