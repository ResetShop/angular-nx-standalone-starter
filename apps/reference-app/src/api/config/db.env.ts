/**
 * Database env sub-schema.
 *
 * Covers the Postgres connection strings used by the app (production) and the
 * integration test suite. This module is self-contained — it does not depend
 * on any other env sub-module — so scripts that only need DB config (seed,
 * sync-permissions, drizzle.config.ts) can import it without triggering
 * validation for unrelated domains (PASETO, SMTP, etc.).
 *
 * Every backend file that needs a DB env var must import `dbEnv` from here
 * (or `parseDbEnv` / `seedDbEnv` for tests). Direct `process.env[...]` access
 * is ESLint-forbidden everywhere except files matching `*.env.ts`.
 */
import { z } from 'zod'
import { formatZodError } from './env-utils'

const DbEnvSchema = z.object({
	PG_CONNECTION_STRING: z.string().min(1),
	PG_TEST_CONNECTION_STRING: z.string().min(1).optional(),
})

export type DbEnv = z.infer<typeof DbEnvSchema>

/**
 * Validates the given environment object against the DB schema.
 * Use this in tests to exercise validation branches without mutating
 * the global `process.env`.
 */
export function parseDbEnv(rawEnv: NodeJS.ProcessEnv): DbEnv {
	return DbEnvSchema.parse(rawEnv)
}

let cachedDbEnv: Readonly<DbEnv> | null = null

function initializeDbEnv(): Readonly<DbEnv> {
	if (cachedDbEnv !== null) return cachedDbEnv
	try {
		cachedDbEnv = Object.freeze(parseDbEnv(process.env))
		return cachedDbEnv
	} catch (error) {
		if (error instanceof z.ZodError) {
			console.error('FATAL: Environment validation failed (db domain):')
			console.error(formatZodError(error))
			console.error('\nSee docs/environment-variables.md for the required variables and delivery options.')
			process.exit(1)
		}
		throw error
	}
}

/**
 * Frozen `DbEnv` populated from `process.env` on first property access.
 * Mirrors the lazy-init pattern of every sub-schema in this directory.
 */
// REASON: Proxy traps intercept all property access; the target is never read directly.
// Only `get` and `has` are defined to avoid violating Proxy invariants when reflecting
// the frozen cache's non-configurable properties through an empty target.
export const dbEnv: Readonly<DbEnv> = new Proxy({} as DbEnv, {
	get(_target, prop) {
		return initializeDbEnv()[prop as keyof DbEnv]
	},
	has(_target, prop) {
		return prop in initializeDbEnv()
	},
})

// ─── Test helpers ─────────────────────────────────────────────────────────────

const DB_ENV_TEST_DEFAULTS: NodeJS.ProcessEnv = {
	PG_CONNECTION_STRING: 'postgresql://test:test@localhost:5432/test',
}

/**
 * Test seeder for the DB sub-schema. Replaces the cached `dbEnv` value with the
 * result of `parseDbEnv({...defaults, ...overrides})`. Bypasses `process.env`
 * so tests can drive specific values without mutating global state.
 *
 * Call in a `beforeEach` or at the top of `test-setup.ts` so the cache is
 * populated before any consumer's first property access.
 */
export function seedDbEnv(overrides: Partial<Record<keyof DbEnv, string>> = {}): void {
	cachedDbEnv = Object.freeze(parseDbEnv({ ...DB_ENV_TEST_DEFAULTS, ...overrides }))
}

/** Clear the cached `dbEnv` so the next property access re-parses `process.env`. */
export function resetDbEnv(): void {
	cachedDbEnv = null
}
