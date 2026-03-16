/**
 * Vitest globalSetup — runs once before all test files in a separate process.
 * Pushes the DB schema to the test database and seeds base data.
 * On teardown, truncates all tables.
 *
 * Seeding and truncation are delegated to db-helpers.ts to avoid duplicating
 * insert logic. Dynamic imports are used because this file runs in a separate
 * process where env vars must be configured before any module reads them.
 */
import { configureEnvVars, getTestConnectionString, loadEnvFile } from './env-helpers'

async function pushSchemaToTestDb(connectionString: string): Promise<void> {
	console.log('[Integration] Pushing schema to test database...')
	const { pushSchema } = await import('drizzle-kit/api')
	const { drizzle } = await import('drizzle-orm/node-postgres')

	const allSchemaImports: Record<string, unknown> = {
		...(await import('../../../db/schema/user')),
		...(await import('../../../db/schema/role')),
		...(await import('../../../db/schema/permission')),
		...(await import('../../../db/schema/authentication')),
		...(await import('../../../db/schema/refresh-token')),
		...(await import('../../../db/schema/permission-route')),
	}

	const db = drizzle(connectionString)
	const pushResult = await pushSchema(allSchemaImports, db)

	if (pushResult.warnings.length > 0) {
		console.log('[Integration] Schema push warnings:', pushResult.warnings)
	}

	await pushResult.apply()
	await db.$client.end()
	console.log('[Integration] Schema pushed successfully.')
}

export async function setup(): Promise<void> {
	loadEnvFile()
	const connectionString = getTestConnectionString()
	configureEnvVars(connectionString)
	await pushSchemaToTestDb(connectionString)

	console.log('[Integration] Seeding base data...')
	const { getTestDb, closeTestDb, truncateAllTables, seedBaseData } = await import('./db-helpers')
	const db = getTestDb()
	await truncateAllTables(db)
	await seedBaseData(db)
	await closeTestDb()
	console.log('[Integration] Base data seeded successfully.')
}

export async function teardown(): Promise<void> {
	if (!process.env['PG_TEST_CONNECTION_STRING']) return

	console.log('[Integration] Cleaning up test database...')
	const { getTestDb, closeTestDb, truncateAllTables } = await import('./db-helpers')
	const db = getTestDb()
	await truncateAllTables(db)
	await closeTestDb()
	console.log('[Integration] Test database cleaned up.')
}
