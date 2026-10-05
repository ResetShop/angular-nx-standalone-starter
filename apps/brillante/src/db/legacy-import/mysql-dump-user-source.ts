import { readFile } from 'node:fs/promises'
import {
	LEGACY_USER_REFERENCES,
	type LegacyUserReferenceColumn,
	type LegacyUserRoleRow,
	type LegacyUserRow,
	type LegacyUserSource,
} from './legacy-user-source'
import { type DumpRow, type DumpTables, parseMysqlDump } from './mysql-dump-parser'
import { SafeImportError } from './safe-import-error'

/**
 * Reads a MySQL `datetime` (no zone) as UTC. Anything that is not a real calendar date and time, including the
 * zero date `0000-00-00 00:00:00` and out-of-range parts such as month 13, has no date.
 */
export function parseLegacyDateTime(value: string | null): Date | null {
	const parts = value ? /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value) : null
	if (!parts) return null
	const [year, month, day, hour, minute, second] = parts.slice(1).map(Number)
	const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
	const isRealDate =
		year >= 1 &&
		date.getUTCFullYear() === year &&
		date.getUTCMonth() === month - 1 &&
		date.getUTCDate() === day &&
		date.getUTCHours() === hour &&
		date.getUTCMinutes() === minute &&
		date.getUTCSeconds() === second
	return isRealDate ? date : null
}

/** Names a row by table and position so the operator can find it; never by content, which is personal data. */
function where(table: string, rowNumber: number): string {
	return `${table} row ${rowNumber}`
}

function requireText(row: DumpRow, column: string, location: string): string {
	const value = row[column]
	if (value === null || value === undefined) {
		throw new SafeImportError(`The legacy dump has a ${location} without ${column}`)
	}
	return value
}

function toInteger(row: DumpRow, column: string, location: string): number {
	const parsed = Number(requireText(row, column, location))
	if (!Number.isInteger(parsed)) {
		throw new SafeImportError(`The legacy dump has a ${location} with a non-integer ${column}`)
	}
	return parsed
}

function toUserRow(row: DumpRow, index: number): LegacyUserRow {
	const location = where('user', index + 1)
	return {
		id: toInteger(row, 'id', location),
		firstName: requireText(row, 'first_name', location),
		lastName: requireText(row, 'last_name', location),
		email: row['email'] ?? null,
		enabled: requireText(row, 'enabled', location) === '1',
		deleted: requireText(row, 'deleted', location) === '1',
		createdAt: parseLegacyDateTime(row['created_at'] ?? null),
		updatedAt: parseLegacyDateTime(row['updated_at'] ?? null),
	}
}

function toUserRoleRow(row: DumpRow, index: number): LegacyUserRoleRow {
	const location = where('user_role', index + 1)
	return {
		userId: toInteger(row, 'id_user', location),
		roleId: toInteger(row, 'id_role', location),
		enabled: requireText(row, 'enabled', location) === '1',
		deleted: requireText(row, 'deleted', location) === '1',
	}
}

/**
 * `LegacyUserSource` over the text of a MySQL dump made of `INSERT` statements. The dump is real personal data:
 * it is read from a path the operator supplies and is never part of the repository. A dump that lacks one of the
 * tables the import needs is rejected: an empty answer would read as "nothing to import" or "no references".
 */
export class MysqlDumpUserSource implements LegacyUserSource {
	private tables: DumpTables | null = null

	constructor(private readonly dumpText: string) {}

	public static async fromFile(path: string): Promise<MysqlDumpUserSource> {
		return new MysqlDumpUserSource(await readFile(path, 'utf8'))
	}

	public async readUsers(): Promise<readonly LegacyUserRow[]> {
		return this.requireTable('user').map(toUserRow)
	}

	public async readUserRoles(): Promise<readonly LegacyUserRoleRow[]> {
		return this.requireTable('user_role').map(toUserRoleRow)
	}

	public async readUserReferences(): Promise<readonly LegacyUserReferenceColumn[]> {
		return LEGACY_USER_REFERENCES.map(({ table, column }) => ({
			table,
			column,
			userIds: this.requireTable(table).map((row) => {
				const value = row[column]
				return value === null || value === undefined ? null : Number(value)
			}),
		}))
	}

	private requireTable(table: string): readonly DumpRow[] {
		const rows = this.parsed().get(table)
		if (!rows) {
			throw new SafeImportError(`The legacy dump has no INSERT statements for the table ${table}`)
		}
		return rows
	}

	private parsed(): DumpTables {
		this.tables ??= parseMysqlDump(this.dumpText, [
			'user',
			'user_role',
			...LEGACY_USER_REFERENCES.map((reference) => reference.table),
		])
		return this.tables
	}
}
