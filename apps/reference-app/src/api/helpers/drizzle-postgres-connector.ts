import { environment } from '@resetshop/hono-core'
import { schema } from '@schema/all'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'

type Connector = NodePgDatabase<typeof schema>

/**
 * The active drizzle handle. In production and in CI's `test-integration`
 * job, this is `drizzle-orm/node-postgres` connected to a real Postgres at
 * the configured `connectionString`. When the integration test setup sets
 * `INTEGRATION_TEST_PGLITE=true` (the local zero-Docker path, see #321), it
 * resolves to a `drizzle-orm/pglite` handle backed by an in-process WASM
 * Postgres — same query API, same schemas, no daemon required.
 *
 * Top-level await is used to keep the export shape (`db: drizzlePgConnector`)
 * unchanged for the Awilix container. The dynamic `await import` of the
 * PGlite path means production builds do not include `@electric-sql/pglite`
 * in the eager module graph — it loads only when the env flag is set.
 *
 * The cast in the PGlite branch is justified by structural compatibility:
 * `drizzle-orm/pglite` exposes the same `PgDatabase` query API as
 * `drizzle-orm/node-postgres`. The union type would degrade `.returning()`
 * and `.transaction()` inference at every call site, so we narrow at the
 * boundary instead.
 */
async function createConnector(): Promise<Connector> {
	// `INTEGRATION_TEST_PGLITE` is set automatically by `integration-setup.ts`
	// when `PG_TEST_CONNECTION_STRING` is unset (the local zero-Docker path).
	// It should NOT be set manually unless deliberately bypassing the
	// detection logic — setting it alongside `PG_TEST_CONNECTION_STRING` will
	// silently force the PGlite branch and ignore the real DB connection.
	if (process.env['INTEGRATION_TEST_PGLITE'] === 'true') {
		const { getPgliteTestDb } = await import('../integration/setup/pglite-test-db')
		return getPgliteTestDb() as unknown as Connector
	}
	const { connectionString } = environment.database.pg
	return drizzle(connectionString, { schema })
}

export const drizzlePgConnector = await createConnector()
export type DrizzlePgConnector = Connector
