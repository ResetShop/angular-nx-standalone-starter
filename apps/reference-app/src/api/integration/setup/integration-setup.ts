/**
 * Vitest setupFile — vitest 4 re-evaluates this for each test file even with
 * `isolate: false` + `maxWorkers: 1` + `fileParallelism: false` (verified by
 * incrementing PID-keyed counters). We work with that constraint by gating
 * the heavy work (schema push + seed) behind a `globalThis` flag, so it runs
 * exactly once per test process regardless of how many times this module is
 * evaluated.
 *
 * Driver decision (set BEFORE any import that touches
 * `drizzle-postgres-connector.ts`): if `PG_TEST_CONNECTION_STRING` is set we
 * run against real Postgres via `drizzle-orm/node-postgres` (CI's in-job
 * postgres:17 service container; or a developer's long-lived local
 * container). If unset we use in-process PGlite via `drizzle-orm/pglite`
 * (zero-Docker local dev path, #321). The `INTEGRATION_TEST_PGLITE` flag set
 * here is read by the connector at module-load.
 */
import { extendZodWithOpenApi } from '@hono/zod-openapi'
import { z } from 'zod'
import { configureEnvVars, loadEnvFile } from './env-helpers'

declare global {
	// eslint-disable-next-line no-var -- globalThis augmentation requires `var`
	var __integrationDbInitialized: boolean | undefined
}

loadEnvFile()

if (!process.env['PG_TEST_CONNECTION_STRING']) {
	process.env['INTEGRATION_TEST_PGLITE'] = 'true'
}

configureEnvVars()
extendZodWithOpenApi(z)

if (!globalThis.__integrationDbInitialized) {
	globalThis.__integrationDbInitialized = true

	const [{ drizzlePgConnector }, { pushSchema }, { sql }, { seedBaseData }] = await Promise.all([
		import('../../helpers/drizzle-postgres-connector'),
		import('drizzle-kit/api'),
		import('drizzle-orm'),
		import('./db-helpers'),
	])
	const { schema } = await import('@schema/all')

	console.log('[Integration] Resetting test database (drop tables + enums)...')
	// No-ops on a fresh PGlite; needed for re-runs against a long-lived real
	// Postgres (CI service container, persistent local container, external DB).
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
