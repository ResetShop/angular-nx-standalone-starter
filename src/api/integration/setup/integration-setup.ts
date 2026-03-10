/**
 * Vitest setupFile — runs before each test file (in the test process).
 * Loads .env, sets env vars, and extends Zod with OpenAPI support.
 *
 * Note: DB schema push and seeding happen in global-setup.ts (globalSetup).
 */
import { extendZodWithOpenApi } from '@hono/zod-openapi';
import { afterAll } from 'vitest';
import { z } from 'zod';
import { loadEnvFile } from './load-env';

// Load .env and configure test-specific env vars.
// These must be set before any test file imports modules that read process.env
// at load time (e.g. auth.constants.ts reads BCRYPT_COST).
loadEnvFile();

if (process.env['PG_TEST_CONNECTION_STRING']) {
	process.env['PG_CONNECTION_STRING'] = process.env['PG_TEST_CONNECTION_STRING'];
}

process.env['PASETO_ACCESS_TOKEN_EXPIRY'] = '5m';
process.env['PASETO_REFRESH_TOKEN_EXPIRY'] = '10m';
process.env['COOKIE_SECURE'] = 'false';
process.env['EMAIL_PROVIDER'] = 'noop';
process.env['BCRYPT_COST'] = '1';

// Must run before any Zod schema is imported by test files.
// Safe to call here because setupFiles execute completely before test file imports.
extendZodWithOpenApi(z);

// Close all DB connection pools after each test file so the process can exit cleanly
afterAll(async () => {
	const { closeTestDb } = await import('./db-helpers');
	await closeTestDb();

	const { drizzlePgConnector } = await import('../../helpers/drizzle-postgres-connector');
	await drizzlePgConnector.$client.end();
});
