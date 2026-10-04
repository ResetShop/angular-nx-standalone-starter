import { writeFile } from 'node:fs/promises'
import { dbEnv } from '../api/config/db.env'
import { createDrizzlePgConnector } from '../api/helpers/drizzle-postgres-connector'
import { createPasswordHasher } from '../api/services/password/password-hasher'
import { DrizzleLegacyUserImportTarget } from './legacy-import/drizzle-legacy-user-target'
import { parseImportLegacyUsersArgs } from './legacy-import/import-legacy-users.args'
import { LegacyUserImportConflictError, runLegacyUserImport } from './legacy-import/legacy-user-import'
import { MysqlDumpUserSource } from './legacy-import/mysql-dump-user-source'

/** The database the import is about to touch, without credentials, so the operator can see where it points. */
function describeTarget(connectionString: string): string {
	const url = new URL(connectionString)
	return `${url.hostname}${url.port ? `:${url.port}` : ''}${url.pathname}`
}

/**
 * Imports the legacy staff users from a local MySQL dump into the database `PG_CONNECTION_STRING` points at.
 * Run it with `--dry-run` first: that reads and plans against the real database, prints the report and writes
 * nothing. See docs/brillante-backend.md ("Legacy user import") for the runbook.
 *
 * Usage: npm run drizzle:import-legacy-users:brillante -- --dump <path> [--dry-run] [--already-provisioned 1]
 */
async function importLegacyUsers(): Promise<void> {
	const args = parseImportLegacyUsersArgs(process.argv.slice(2))
	console.log(`Target database: ${describeTarget(dbEnv.PG_CONNECTION_STRING)}`)
	console.log(args.dryRun ? 'DRY RUN: nothing will be written.' : 'Writing the users to the target database.')

	const source = await MysqlDumpUserSource.fromFile(args.dumpPath)
	const db = createDrizzlePgConnector()
	try {
		const result = await db.transaction((tx) =>
			runLegacyUserImport(source, new DrizzleLegacyUserImportTarget(tx, createPasswordHasher()), {
				dryRun: args.dryRun,
				alreadyProvisionedLegacyUserIds: args.alreadyProvisionedLegacyUserIds,
			}),
		)
		console.log(result.report)
		console.log(args.dryRun ? 'Dry run finished: nothing was written.' : `Imported ${result.written} user(s).`)
		if (args.reportPath) await writeFile(args.reportPath, `${result.report}\n`)
	} finally {
		await db.$client.end()
	}
}

importLegacyUsers()
	.then(() => process.exit(0))
	.catch((error: unknown) => {
		console.error(error instanceof LegacyUserImportConflictError ? error.message : `Import failed: ${String(error)}`)
		process.exit(1)
	})
