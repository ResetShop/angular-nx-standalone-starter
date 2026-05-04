/**
 * Smoke test for the PGlite integration plan (#321).
 *
 * Verifies that drizzle-kit/api's pushSchema accepts a PGlite-backed drizzle
 * handle and creates our schemas correctly — including pgEnum types and
 * foreign keys. If this passes, the full PGlite refactor is unblocked. If it
 * fails, the approach needs to be reconsidered before tearing up the working
 * cross-process global-setup.ts.
 *
 * Run via:
 *   npm run smoke:pglite
 *
 * Imports the curated `schema` value used in production (`@schema/all`) so
 * the smoke is exercising the same shape that the integration suite pushes.
 * If a future commit drops a table or enum from `all.ts`, this script catches
 * it before the suite does. Asserts the resulting Postgres-in-WASM instance
 * has the expected tables, enums, and accepts a basic insert+select.
 */
import { PGlite } from '@electric-sql/pglite'
import { pushSchema } from 'drizzle-kit/api'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { schema } from '../apps/reference-app/src/db/schema/all'
import * as user from '../apps/reference-app/src/db/schema/user'

async function main(): Promise<void> {
	console.log('[Smoke] Creating in-process PGlite instance...')
	const pglite = new PGlite()
	const db = drizzle(pglite, { schema })

	console.log('[Smoke] Running drizzle-kit/api pushSchema against PGlite...')
	const pushResult = await pushSchema(schema, db)
	if (pushResult.warnings.length > 0) {
		console.log('[Smoke] pushSchema warnings:', pushResult.warnings)
	}
	await pushResult.apply()
	console.log('[Smoke] pushSchema succeeded.')

	console.log('[Smoke] Verifying tables exist...')
	const tablesResult = await db.execute(
		sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
	)
	const tableNames = (tablesResult.rows as Array<{ tablename: string }>).map((r) => r.tablename)
	console.log(`[Smoke] Tables (${tableNames.length}): ${tableNames.join(', ')}`)

	const expectedTables = ['user', 'authentication', 'permission', 'role', 'role_permission', 'user_role']
	for (const expected of expectedTables) {
		if (!tableNames.includes(expected)) {
			throw new Error(`[Smoke] Expected table "${expected}" not found in PGlite database.`)
		}
	}
	console.log('[Smoke] All expected tables present.')

	console.log('[Smoke] Verifying enum types exist...')
	const enumsResult = await db.execute(
		sql`SELECT typname FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typtype = 'e' ORDER BY typname`,
	)
	const enumNames = (enumsResult.rows as Array<{ typname: string }>).map((r) => r.typname)
	console.log(`[Smoke] Enums (${enumNames.length}): ${enumNames.join(', ')}`)

	if (!enumNames.includes('user_status')) {
		throw new Error('[Smoke] Expected enum "user_status" not found — pgEnum did not land in PGlite.')
	}
	console.log('[Smoke] pgEnum present in PGlite as expected.')

	console.log('[Smoke] Verifying foreign keys exist...')
	const fkResult = await db.execute(
		sql`SELECT conname FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace ORDER BY conname`,
	)
	const fkNames = (fkResult.rows as Array<{ conname: string }>).map((r) => r.conname)
	console.log(`[Smoke] Foreign key constraints (${fkNames.length}): ${fkNames.join(', ')}`)
	if (fkNames.length === 0) {
		throw new Error('[Smoke] Expected at least one foreign key constraint — none found.')
	}
	console.log('[Smoke] Foreign keys present.')

	console.log('[Smoke] Running an end-to-end insert + select to verify the wire works...')
	await db.insert(user.user).values({
		firstName: 'Smoke',
		lastName: 'Test',
		email: 'smoke@test.local',
	})
	const inserted = await db.select().from(user.user)
	if (inserted.length !== 1 || inserted[0].email !== 'smoke@test.local') {
		throw new Error(`[Smoke] Insert+select roundtrip failed. Got: ${JSON.stringify(inserted)}`)
	}
	console.log('[Smoke] Insert+select roundtrip succeeded:', inserted[0])

	await pglite.close()
	console.log('[Smoke] PASS — PGlite path is viable for #321 implementation.')
}

main().catch((err) => {
	console.error('[Smoke] FAIL:', err)
	process.exit(1)
})
