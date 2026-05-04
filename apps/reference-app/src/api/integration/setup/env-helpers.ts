/**
 * Shared environment helpers for integration test setup.
 *
 * Connection-string plumbing was removed in #321 — `drizzle-postgres-connector.ts`
 * now handles the driver/connection decision at module-load via the
 * `INTEGRATION_TEST_PGLITE` flag set by `integration-setup.ts`. These helpers
 * only deal with `.env` loading and PASETO/bcrypt/email defaults.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Parses a .env file and sets any missing keys on process.env.
 * Silently skips if the file is not found.
 */
export function loadEnvFile(): void {
	try {
		const envPath = resolve(process.cwd(), '.env')
		const envContent = readFileSync(envPath, 'utf-8')
		for (const line of envContent.split('\n')) {
			const trimmed = line.trim()
			if (!trimmed || trimmed.startsWith('#')) continue
			const eqIndex = trimmed.indexOf('=')
			if (eqIndex === -1) continue
			const key = trimmed.slice(0, eqIndex).trim()
			const value = trimmed.slice(eqIndex + 1).trim()
			if (!process.env[key]) {
				process.env[key] = value.replace(/^(['"])(.*)\1$/, '$2')
			}
		}
	} catch {
		// .env not found — rely on existing env vars
	}
}

/**
 * Sets test-only defaults for PASETO, bcrypt, email — these are read at
 * module-load by various services. Idempotent: existing values from `.env`
 * or the shell environment win.
 *
 * Note: `PG_CONNECTION_STRING` mirrors `PG_TEST_CONNECTION_STRING` for the
 * node-postgres path so any module reading the production env var (e.g.
 * `@resetshop/hono-core`'s environment.database.pg.connectionString) gets
 * the test DB. Skipped in PGlite mode — there's no connection string.
 */
export function configureEnvVars(): void {
	const testConnectionString = process.env['PG_TEST_CONNECTION_STRING']
	if (testConnectionString) {
		process.env['PG_CONNECTION_STRING'] = testConnectionString
	}

	if (!process.env['PASETO_SECRET_KEY']) {
		process.env['PASETO_SECRET_KEY'] = 'a'.repeat(64)
	}
	if (!process.env['PASETO_ISSUER']) {
		process.env['PASETO_ISSUER'] = 'integration-test'
	}
	process.env['PASETO_ACCESS_TOKEN_EXPIRY'] = '5m'
	process.env['PASETO_REFRESH_TOKEN_EXPIRY'] = '10m'
	process.env['COOKIE_SECURE'] = 'false'
	process.env['EMAIL_PROVIDER'] = 'noop'
	process.env['BCRYPT_COST'] = '1'
}
