/**
 * Shared environment helpers for integration test setup files.
 * Used by both global-setup.ts (separate process) and integration-setup.ts (test process).
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

export function getTestConnectionString(): string {
	const testConnectionString = process.env['PG_TEST_CONNECTION_STRING']
	if (!testConnectionString) {
		throw new Error(
			'PG_TEST_CONNECTION_STRING environment variable is required for integration tests. ' +
				'Set it in .env or export it before running tests.',
		)
	}
	return testConnectionString
}

export function configureEnvVars(testConnectionString: string): void {
	process.env['PG_CONNECTION_STRING'] = testConnectionString

	// Test-only predictable key — PASETO_SECRET_KEY should always be set in .env for non-ephemeral environments
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
	// Set here (not in the cleanup-tokens spec's beforeAll) so it is present before the route
	// graph imports — the change-password rate limiter reads authEnv at module load, which caches
	// the auth env snapshot. A late process.env write would never reach authConfig.cronSecret.
	// Keep in sync with TEST_CRON_SECRET in cleanup-tokens.integration.spec.ts.
	process.env['CRON_SECRET'] = 'integration-cron-secret-0123456789abcdef'
}
