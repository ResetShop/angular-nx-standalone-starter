/**
 * HTTP / hosting env sub-schema.
 *
 * Covers the listening port, CORS configuration, the SSR base path, and the
 * serverless mode flag. Exports the `isServerless()` helper alongside its
 * source (`IS_SERVERLESS`).
 *
 * Every backend file that needs an HTTP env var must import `httpEnv` from
 * here (or `parseHttpEnv` / `seedHttpEnv` for tests). Direct `process.env`
 * access is ESLint-forbidden everywhere except files matching `*.env.ts`.
 */
import { parseDurationToSeconds } from '@resetshop/util'
import { z } from 'zod'

const DEFAULT_PORT = 4000
const DEFAULT_CORS_ORIGIN = 'http://localhost:4200'
const DEFAULT_CORS_MAX_AGE = parseDurationToSeconds('24h')

const HttpEnvSchema = z.object({
	BASE_HREF: z.string().optional(),
	IS_SERVERLESS: z
		.string()
		.optional()
		.transform((v) => v === 'true'),
	PORT: z.coerce.number().int().min(1).max(65535).default(DEFAULT_PORT).catch(DEFAULT_PORT),
	CORS_ORIGIN: z.string().default(DEFAULT_CORS_ORIGIN),
	CORS_MAX_AGE: z.coerce.number().int().positive().default(DEFAULT_CORS_MAX_AGE).catch(DEFAULT_CORS_MAX_AGE),
})

export type HttpEnv = z.infer<typeof HttpEnvSchema>

export function parseHttpEnv(rawEnv: NodeJS.ProcessEnv): HttpEnv {
	return HttpEnvSchema.parse(rawEnv)
}

function formatZodError(error: z.ZodError): string {
	return error.issues.map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`).join('\n')
}

let cachedHttpEnv: Readonly<HttpEnv> | null = null

function initializeHttpEnv(): Readonly<HttpEnv> {
	if (cachedHttpEnv !== null) return cachedHttpEnv
	try {
		cachedHttpEnv = Object.freeze(parseHttpEnv(process.env))
		return cachedHttpEnv
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('FATAL: Environment validation failed (http domain):')
			console.error(formatZodError(error))
			console.error('\nSee docs/environment-variables.md for the required variables and delivery options.')
			process.exit(1)
		}
		throw error
	}
}

// REASON: Proxy traps intercept all property access; the target is never read directly.
export const httpEnv: Readonly<HttpEnv> = new Proxy({} as HttpEnv, {
	get(_target, prop) {
		return initializeHttpEnv()[prop as keyof HttpEnv]
	},
	has(_target, prop) {
		return prop in initializeHttpEnv()
	},
})

/**
 * True when the app is running in a connection-pooled serverless environment.
 * Reads from the validated `httpEnv` rather than `process.env` directly.
 */
export function isServerless(): boolean {
	return httpEnv.IS_SERVERLESS
}

// ─── Test helpers ─────────────────────────────────────────────────────────────

const HTTP_ENV_TEST_DEFAULTS: NodeJS.ProcessEnv = {}

export function seedHttpEnv(overrides: Partial<Record<keyof HttpEnv, string>> = {}): void {
	cachedHttpEnv = Object.freeze(parseHttpEnv({ ...HTTP_ENV_TEST_DEFAULTS, ...overrides }))
}

export function resetHttpEnv(): void {
	cachedHttpEnv = null
}
