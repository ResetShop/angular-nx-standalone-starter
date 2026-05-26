/**
 * Vitest setupFile — runs before each test file (in the test process).
 * Loads .env, sets env vars, and extends Zod with OpenAPI support.
 *
 * Note: DB schema push and seeding happen in global-setup.ts (globalSetup).
 */
import { extendZodWithOpenApi } from '@hono/zod-openapi'
import { afterAll } from 'vitest'
import { z } from 'zod'
import { configureEnvVars, getTestConnectionString, loadEnvFile } from './env-helpers'

// Load .env and configure test-specific env vars.
// These must be set before any test file imports modules that read process.env
// at load time (e.g. password-hasher.ts reads BCRYPT_COST).
loadEnvFile()
configureEnvVars(getTestConnectionString())

// Must run before any Zod schema is imported by test files.
// Safe to call here because setupFiles execute completely before test file imports.
extendZodWithOpenApi(z)

// Close test-helper DB pool after each test file so connections don't leak.
// The app's drizzlePgConnector pool is NOT closed here — ending it mid-run
// can cause subsequent queries to silently return empty results instead of
// throwing, because node-postgres marks the Pool as ended. The process exit
// handles final cleanup automatically.
afterAll(async () => {
	const { closeTestDb } = await import('./db-helpers')
	await closeTestDb()
})
