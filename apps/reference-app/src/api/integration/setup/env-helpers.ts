/**
 * Shared environment helpers for integration test setup files.
 * Used by both global-setup.ts (separate process) and integration-setup.ts (test process).
 *
 * Env vars must be delivered via one of the supported mechanisms documented in
 * docs/environment-variables.md (shell export, out-of-tree env file via
 * `node --env-file`, IDE run config, or `direnv`). This module never reads
 * `.env` from the working tree — the repo policy forbids `.env*` files there.
 */

export function getTestConnectionString(): string {
	const testConnectionString = process.env['PG_TEST_CONNECTION_STRING']
	if (!testConnectionString) {
		throw new Error(
			'PG_TEST_CONNECTION_STRING environment variable is required for integration tests. ' +
				'See docs/environment-variables.md for the supported delivery options.',
		)
	}
	return testConnectionString
}

export function configureEnvVars(testConnectionString: string): void {
	process.env['PG_CONNECTION_STRING'] = testConnectionString

	// Test-only predictable key — PASETO_SECRET_KEY should be delivered via one
	// of the supported mechanisms (see docs/environment-variables.md) for any
	// non-ephemeral environment.
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
