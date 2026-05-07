/**
 * Vitest globalSetup — runs once in the CLI process before any test workers,
 * once at the end after all tests complete. Vitest workers are forked AFTER
 * setup() returns, so any `process.env` mutation here is inherited by every
 * worker via standard fork() env semantics.
 *
 * Responsibilities:
 *   1. Boot the embedded Postgres cluster (no-Docker local path) OR keep
 *      whatever `PG_TEST_CONNECTION_STRING` was already set (CI's
 *      `postgres:17` service container).
 *   2. Mirror the connection string into `PG_CONNECTION_STRING` so the
 *      production `drizzle-postgres-connector.ts` reads the test DB.
 *   3. Push the curated schema and seed base data — once per suite.
 *   4. On teardown, shut the embedded cluster down (no-op for CI path).
 */
import { extendZodWithOpenApi } from '@hono/zod-openapi'
import { pushSchema } from 'drizzle-kit/api'
import { sql } from 'drizzle-orm'
import { z } from 'zod'
import { startEmbeddedPostgres, stopEmbeddedPostgres } from './embedded-pg-test-db'
import { configureEnvVars, loadEnvFile } from './env-helpers'

let usedEmbeddedPg = false

export async function setup(): Promise<void> {
	loadEnvFile()

	if (!process.env['PG_TEST_CONNECTION_STRING']) {
		process.env['PG_TEST_CONNECTION_STRING'] = await startEmbeddedPostgres()
		usedEmbeddedPg = true
	}

	configureEnvVars()
	extendZodWithOpenApi(z)

	const { drizzlePgConnector } = await import('../../helpers/drizzle-postgres-connector')
	const { seedBaseData } = await import('./db-helpers')
	const { schema } = await import('@schema/all')

	console.log('[Integration] Resetting test database (drop tables + enums)...')
	// No-ops on a fresh embedded cluster; needed for re-runs against a
	// long-lived real Postgres (CI service container, persistent local
	// container, external DB).
	await drizzlePgConnector.execute(sql`
		DO $$ DECLARE r RECORD;
		BEGIN
			FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
				EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
			END LOOP;
		END $$;
	`)
	await drizzlePgConnector.execute(sql`
		DO $$ DECLARE r RECORD;
		BEGIN
			FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e') LOOP
				EXECUTE 'DROP TYPE IF EXISTS "' || r.typname || '" CASCADE';
			END LOOP;
		END $$;
	`)

	console.log('[Integration] Pushing schema...')
	const pushResult = await pushSchema(schema, drizzlePgConnector)
	if (pushResult.warnings.length > 0) {
		console.log('[Integration] Schema push warnings:', pushResult.warnings)
	}
	await pushResult.apply()

	console.log('[Integration] Seeding base data...')
	await seedBaseData(drizzlePgConnector)
	console.log('[Integration] Setup complete.')
}

export async function teardown(): Promise<void> {
	if (usedEmbeddedPg) {
		await stopEmbeddedPostgres()
	}
}
