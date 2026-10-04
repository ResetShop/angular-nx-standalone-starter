import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDump, buildReferenceInsert, buildUserInsert, buildUserRoleInsert } from './legacy-dump.testing'
import { MysqlDumpUserSource, parseLegacyDateTime } from './mysql-dump-user-source'

describe('parseLegacyDateTime', () => {
	it('reads a MySQL datetime as UTC', () => {
		expect(parseLegacyDateTime('2020-09-04 21:57:18')).toEqual(new Date('2020-09-04T21:57:18.000Z'))
	})

	it.each([
		null,
		'',
		'0000-00-00',
		'0000-00-00 00:00:00',
		'2023-02-31 10:00:00',
		'2023-13-01 10:00:00',
		'2023-01-01 25:00:00',
		'2023-01-01 10:61:00',
		'2020-09-04T21:57:18Z',
		'yesterday',
	])('has no date for %j', (value) => {
		expect(parseLegacyDateTime(value)).toBeNull()
	})

	it('accepts a leap day', () => {
		expect(parseLegacyDateTime('2024-02-29 00:00:00')).toEqual(new Date('2024-02-29T00:00:00.000Z'))
	})
})

const otherReferenceTables: readonly (readonly [string, string])[] = [
	['sh_fix_repair_status_history', 'modified_user_id'],
	['sh_fix_repair', 'usuario_creador'],
	['sh_fix_repair', 'usuario_modificador'],
	['sh_fix_customer', 'created_by'],
	['sh_fix_customer', 'updated_by'],
]

function buildOtherReferences(): string[] {
	return otherReferenceTables.map(([table, column]) => buildReferenceInsert(table, column, [4]))
}

describe('MysqlDumpUserSource', () => {
	const dump = buildDump(
		buildUserInsert([
			{ id: 4, firstName: 'Ana', lastName: "D'Arco", email: 'ana@example.test' },
			{ id: 9, firstName: 'Ben', lastName: 'Ito', email: null, enabled: false, deleted: true },
		]),
		buildUserRoleInsert([
			{ userId: 4, roleId: 3 },
			{ userId: 9, roleId: 6, enabled: false, deleted: true },
		]),
		buildReferenceInsert('sh_cash_transaction', 'created_user_id', [4, 4, 0, null]),
		...buildOtherReferences(),
		buildReferenceInsert('unrelated_table', 'created_user_id', [1]),
	)

	it('maps user rows with booleans, UTC dates and a nullable email', async () => {
		const users = await new MysqlDumpUserSource(dump).readUsers()

		expect(users).toEqual([
			{
				id: 4,
				firstName: 'Ana',
				lastName: "D'Arco",
				email: 'ana@example.test',
				enabled: true,
				deleted: false,
				createdAt: new Date('2020-01-02T03:04:05.000Z'),
				updatedAt: new Date('2021-06-07T08:09:10.000Z'),
			},
			{
				id: 9,
				firstName: 'Ben',
				lastName: 'Ito',
				email: null,
				enabled: false,
				deleted: true,
				createdAt: new Date('2020-01-02T03:04:05.000Z'),
				updatedAt: new Date('2021-06-07T08:09:10.000Z'),
			},
		])
	})

	it('maps user role rows', async () => {
		const userRoles = await new MysqlDumpUserSource(dump).readUserRoles()

		expect(userRoles).toEqual([
			{ userId: 4, roleId: 3, enabled: true, deleted: false },
			{ userId: 9, roleId: 6, enabled: false, deleted: true },
		])
	})

	it('reads the user ids held by the legacy reference columns, with nulls kept', async () => {
		const references = await new MysqlDumpUserSource(dump).readUserReferences()

		const cash = references.find((reference) => reference.table === 'sh_cash_transaction')
		expect(cash?.userIds).toEqual([4, 4, 0, null])
		expect(references).toHaveLength(6)
		expect(references.some((reference) => reference.table === 'unrelated_table')).toBe(false)
	})

	it.each([
		['user', (source: MysqlDumpUserSource) => source.readUsers()],
		['user_role', (source: MysqlDumpUserSource) => source.readUserRoles()],
		['sh_cash_transaction', (source: MysqlDumpUserSource) => source.readUserReferences()],
	])('rejects a dump without INSERT statements for %s instead of answering with nothing', async (table, read) => {
		const users = buildUserInsert([{ id: 4, firstName: 'Ana', lastName: 'Gomez', email: 'a@example.test' }])
		const userRoles = buildUserRoleInsert([{ userId: 4, roleId: 3 }])
		const dumps: Record<string, string> = {
			user: buildDump(userRoles),
			user_role: buildDump(users),
			sh_cash_transaction: buildDump(users, userRoles, ...buildOtherReferences()),
		}
		const source = new MysqlDumpUserSource(dumps[table])

		await expect(read(source)).rejects.toThrow('no INSERT statements for the table ' + table)
	})

	it('names the row of a user that cannot be read, never its content', async () => {
		const broken = buildDump(
			"INSERT INTO `user` (`id`, `first_name`, `last_name`, `enabled`, `deleted`) VALUES (1, 'A', 'B', 1, 0), (2, 'A', NULL, 1, 0);\n",
		)

		await expect(new MysqlDumpUserSource(broken).readUsers()).rejects.toThrow(/user row 2 without last_name/)
	})

	it('rejects a user row without a required column', async () => {
		const broken = buildDump("INSERT INTO `user` (`id`, `first_name`) VALUES (1, 'Solo');\n")

		await expect(new MysqlDumpUserSource(broken).readUsers()).rejects.toThrow(/without last_name/)
	})

	it('rejects a user row with a non-integer id without echoing the value', async () => {
		const broken = buildDump(
			"INSERT INTO `user` (`id`, `first_name`, `last_name`, `enabled`, `deleted`) VALUES ('secret', 'A', 'B', 1, 0);\n",
		)
		const read = new MysqlDumpUserSource(broken).readUsers()

		await expect(read).rejects.toThrow(/non-integer id/)
		await expect(read.catch((error: Error) => error.message)).resolves.not.toContain('secret')
	})

	it('reads the dump from a file path', async () => {
		const directory = mkdtempSync(join(tmpdir(), 'legacy-dump-spec-'))
		const path = join(directory, 'dump.sql')
		writeFileSync(path, dump)

		try {
			const users = await (await MysqlDumpUserSource.fromFile(path)).readUsers()

			expect(users.map((user) => user.id)).toEqual([4, 9])
		} finally {
			rmSync(directory, { recursive: true, force: true })
		}
	})
})
