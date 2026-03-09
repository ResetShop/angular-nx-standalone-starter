/**
 * Vitest setupFile — runs before each test file (in the test process).
 * Loads .env, sets env vars, and extends Zod with OpenAPI support.
 *
 * Note: DB schema push and seeding happen in global-setup.ts (globalSetup).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env file (vitest doesn't auto-load it like Nx does)
try {
	const envPath = resolve(process.cwd(), '.env');
	const envContent = readFileSync(envPath, 'utf-8');
	for (const line of envContent.split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eqIndex = trimmed.indexOf('=');
		if (eqIndex === -1) continue;
		const key = trimmed.slice(0, eqIndex).trim();
		const value = trimmed.slice(eqIndex + 1).trim();
		if (!process.env[key]) {
			process.env[key] = value;
		}
	}
} catch {
	// .env not found — rely on existing env vars
}

// Override: use PG_TEST_CONNECTION_STRING for the test database
if (process.env['PG_TEST_CONNECTION_STRING']) {
	process.env['PG_CONNECTION_STRING'] = process.env['PG_TEST_CONNECTION_STRING'];
}

// Set test-specific env vars (these override .env values)
process.env['PASETO_ACCESS_TOKEN_EXPIRY'] = '5m';
process.env['PASETO_REFRESH_TOKEN_EXPIRY'] = '10m';
process.env['COOKIE_SECURE'] = 'false';
process.env['EMAIL_PROVIDER'] = 'ethereal';

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
