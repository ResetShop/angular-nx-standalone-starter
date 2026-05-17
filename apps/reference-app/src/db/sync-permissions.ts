import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { PERMISSIONS_SEED_DATA } from '../contracts/permission/permission.constants'
import { permission } from './schema/permission'

/**
 * Incremental permission sync script.
 *
 * Reads PERMISSIONS_SEED_DATA (derived from PERMISSION_DEFINITIONS in contracts),
 * compares with the database, inserts missing permissions, and warns about orphans.
 *
 * Does NOT modify role-permission assignments — that's a separate admin action.
 *
 * Usage:
 *   npm run sync:permissions   (reads PG_CONNECTION_STRING from env;
 *                               see docs/environment-variables.md for delivery options)
 */

function computeMissing(existingNames: Set<string>) {
	return PERMISSIONS_SEED_DATA.filter((p) => !existingNames.has(p.name))
}

function computeOrphaned(existingNames: Set<string>) {
	const codeNames = new Set<string>(PERMISSIONS_SEED_DATA.map((p) => p.name))
	return [...existingNames].filter((name) => !codeNames.has(name))
}

// Read PG_CONNECTION_STRING from process.env directly rather than via @config/env.
// This script is a one-off DB maintenance tool that only needs the DB connection
// string — importing the full env contract would fail validation on missing
// PASETO/SMTP vars that this script never uses. See docs/environment-variables.md.
function getConnectionString(): string {
	const connectionString = process.env['PG_CONNECTION_STRING']
	if (!connectionString) {
		throw new Error(
			'PG_CONNECTION_STRING is required to run sync-permissions. ' +
				'See docs/environment-variables.md for the supported delivery options.',
		)
	}
	return connectionString
}

async function syncPermissions(): Promise<void> {
	const pool = new Pool({ connectionString: getConnectionString() })
	const db = drizzle(pool)

	try {
		console.log('[sync-permissions] Querying existing permissions...')
		const existing = await db.select({ name: permission.name }).from(permission)
		const existingNames = new Set(existing.map((p) => p.name))

		const missing = computeMissing(existingNames)
		const orphaned = computeOrphaned(existingNames)

		if (missing.length > 0) {
			await db
				.insert(permission)
				.values([...missing])
				.onConflictDoNothing()
			const names = missing.map((p) => p.name).join(', ')
			console.log(`[sync-permissions] Added ${missing.length} new permissions: ${names}`)
		} else {
			console.log('[sync-permissions] All permissions are in sync.')
		}

		if (orphaned.length > 0) {
			for (const name of orphaned) {
				console.warn(`[sync-permissions] Orphaned permission in DB (not in code): ${name}`)
			}
		}

		console.log(`[sync-permissions] Done. ${existingNames.size + missing.length} total, ${orphaned.length} orphaned.`)
		process.exit(0)
	} catch (error) {
		console.error('[sync-permissions] Failed:', error)
		process.exit(1)
	} finally {
		await pool.end()
	}
}

void syncPermissions()
