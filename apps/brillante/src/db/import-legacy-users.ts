import { TransactionRollbackError } from 'drizzle-orm'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { dbEnv } from '../api/config/db.env'
import { createDrizzlePgConnector } from '../api/helpers/drizzle-postgres-connector'
import { createPasswordHasher } from '../api/services/password/password-hasher'
import { DrizzleLegacyUserImportTarget } from './legacy-import/drizzle-legacy-user-target'
import { parseImportLegacyUsersArgs } from './legacy-import/import-legacy-users.args'
import { describeConnectionTarget, formatImportFailure } from './legacy-import/import-legacy-users.output'
import { type LegacyUserImportResult, runLegacyUserImport } from './legacy-import/legacy-user-import'
import { MysqlDumpUserSource } from './legacy-import/mysql-dump-user-source'
import { SafeImportError } from './legacy-import/safe-import-error'

/**
 * Runs the import in one transaction. A dry run is rolled back at the end, so that nothing is committed does not
 * depend on the importer returning early.
 */
async function runInTransaction(
	args: ReturnType<typeof parseImportLegacyUsersArgs>,
	source: MysqlDumpUserSource,
): Promise<LegacyUserImportResult> {
	const db = createDrizzlePgConnector()
	let result: LegacyUserImportResult | undefined
	try {
		await db.transaction(async (tx) => {
			result = await runLegacyUserImport(source, new DrizzleLegacyUserImportTarget(tx, createPasswordHasher()), {
				dryRun: args.dryRun,
				alreadyProvisionedLegacyUserIds: args.alreadyProvisionedLegacyUserIds,
			})
			if (args.dryRun) tx.rollback()
		})
	} catch (error) {
		if (!(error instanceof TransactionRollbackError)) throw error
	} finally {
		await db.$client.end()
	}
	if (!result) throw new SafeImportError('The import produced no result.')
	return result
}

/** The report is written after the commit: a failure here must not look like a failed import. */
async function writeReportFile(path: string, report: string): Promise<void> {
	try {
		await writeFile(path, `${report}\n`)
	} catch {
		console.warn(`Warning: the import finished, but the report could not be written to ${path}.`)
	}
}

/**
 * Imports the legacy staff users from a local MySQL dump into the database `PG_CONNECTION_STRING` points at.
 * Without `--apply` it only previews: it reads and plans against the real database, prints the report and writes
 * nothing. See docs/brillante-backend.md ("Legacy user import") for the runbook.
 *
 * Usage: npm run drizzle:import-legacy-users:brillante -- --dump <path> [--apply] [--already-provisioned 1]
 */
async function importLegacyUsers(): Promise<void> {
	const args = parseImportLegacyUsersArgs(process.argv.slice(2))
	if (args.reportPath && resolve(args.reportPath) === resolve(args.dumpPath)) {
		throw new SafeImportError('--report must not point at the dump: it would overwrite it.')
	}
	console.log(`Target database: ${describeConnectionTarget(dbEnv.PG_CONNECTION_STRING)}`)
	console.log(args.dryRun ? 'DRY RUN: nothing will be written.' : 'APPLY: writing the users to the target database.')

	const result = await runInTransaction(args, await MysqlDumpUserSource.fromFile(args.dumpPath))
	console.log(result.report)
	console.log(args.dryRun ? 'Dry run finished: nothing was written.' : `Imported ${result.written} user(s).`)
	if (args.reportPath) await writeReportFile(args.reportPath, result.report)
}

importLegacyUsers()
	.then(() => process.exit(0))
	.catch((error: unknown) => {
		console.error(`Import failed: ${formatImportFailure(error)}`)
		process.exit(1)
	})
