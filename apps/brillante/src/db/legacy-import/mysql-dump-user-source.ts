import { readFile } from 'node:fs/promises'
import {
	LEGACY_USER_REFERENCES,
	type LegacyUserReferenceColumn,
	type LegacyUserRoleRow,
	type LegacyUserRow,
	type LegacyUserSource,
} from './legacy-user-source'
import { type DumpRow, type DumpTables, parseMysqlDump } from './mysql-dump-parser'

const DATETIME = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/

/** Reads a MySQL `datetime` (no zone) as UTC; anything else is not a usable date. */
export function parseLegacyDateTime(value: string | null): Date | null {
	const parts = value ? DATETIME.exec(value) : null
	if (!parts) return null
	const [year, month, day, hour, minute, second] = parts.slice(1).map(Number)
	return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
}

function requireText(row: DumpRow, column: string, table: string): string {
	const value = row[column]
	if (value === null || value === undefined) {
		throw new Error(`The legacy ${table} dump has a row without ${column}`)
	}
	return value
}

function toInteger(row: DumpRow, column: string, table: string): number {
	const parsed = Number(requireText(row, column, table))
	if (!Number.isInteger(parsed)) {
		throw new Error(`The legacy ${table} dump has a non-integer ${column}`)
	}
	return parsed
}

function toUserRow(row: DumpRow): LegacyUserRow {
	return {
		id: toInteger(row, 'id', 'user'),
		firstName: requireText(row, 'first_name', 'user'),
		lastName: requireText(row, 'last_name', 'user'),
		email: row['email'] ?? null,
		enabled: requireText(row, 'enabled', 'user') === '1',
		deleted: requireText(row, 'deleted', 'user') === '1',
		createdAt: parseLegacyDateTime(row['created_at'] ?? null),
		updatedAt: parseLegacyDateTime(row['updated_at'] ?? null),
	}
}

function toUserRoleRow(row: DumpRow): LegacyUserRoleRow {
	return {
		userId: toInteger(row, 'id_user', 'user_role'),
		roleId: toInteger(row, 'id_role', 'user_role'),
		enabled: requireText(row, 'enabled', 'user_role') === '1',
		deleted: requireText(row, 'deleted', 'user_role') === '1',
	}
}

/**
 * `LegacyUserSource` over the text of a MySQL dump made of `INSERT` statements. The dump is real personal data:
 * it is read from a path the operator supplies and is never part of the repository.
 */
export class MysqlDumpUserSource implements LegacyUserSource {
	private tables: DumpTables | null = null

	constructor(private readonly dumpText: string) {}

	public static async fromFile(path: string): Promise<MysqlDumpUserSource> {
		return new MysqlDumpUserSource(await readFile(path, 'utf8'))
	}

	public async readUsers(): Promise<readonly LegacyUserRow[]> {
		return (this.parsed().get('user') ?? []).map(toUserRow)
	}

	public async readUserRoles(): Promise<readonly LegacyUserRoleRow[]> {
		return (this.parsed().get('user_role') ?? []).map(toUserRoleRow)
	}

	public async readUserReferences(): Promise<readonly LegacyUserReferenceColumn[]> {
		const tables = this.parsed()
		return LEGACY_USER_REFERENCES.map(({ table, column }) => ({
			table,
			column,
			userIds: (tables.get(table) ?? []).map((row) => {
				const value = row[column]
				return value === null || value === undefined ? null : Number(value)
			}),
		}))
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
