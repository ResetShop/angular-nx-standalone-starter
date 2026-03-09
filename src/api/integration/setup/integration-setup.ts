/**
 * Vitest setupFile — runs before each test file (in the test process).
 * Loads .env, sets env vars, and extends Zod with OpenAPI support.
 *
 * Note: DB schema push and seeding happen in global-setup.ts (globalSetup).
 */
import { loadEnvFile } from './load-env';

loadEnvFile();

// Override: use PG_TEST_CONNECTION_STRING for the test database
if (process.env['PG_TEST_CONNECTION_STRING']) {
	process.env['PG_CONNECTION_STRING'] = process.env['PG_TEST_CONNECTION_STRING'];
}

// Set test-specific env vars (these override .env values)
process.env['PASETO_ACCESS_TOKEN_EXPIRY'] = '5m';
process.env['PASETO_REFRESH_TOKEN_EXPIRY'] = '10m';
process.env['COOKIE_SECURE'] = 'false';
process.env['EMAIL_PROVIDER'] = 'noop';
process.env['BCRYPT_COST'] = '1';

// Must run before any schema or controller import
import { extendZodWithOpenApi } from '@hono/zod-openapi';
import { afterAll } from 'vitest';
import { z } from 'zod';

extendZodWithOpenApi(z);

// Close all DB connection pools after each test file so the process can exit cleanly
afterAll(async () => {
	const { closeTestDb } = await import('./db-helpers');
	await closeTestDb();

	const { drizzlePgConnector } = await import('../../helpers/drizzle-postgres-connector');
	await drizzlePgConnector.$client.end();
});
