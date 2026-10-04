import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildDump, buildReferenceInsert, buildUserInsert, buildUserRoleInsert } from './legacy-dump.testing'
import { MysqlDumpUserSource, parseLegacyDateTime } from './mysql-dump-user-source'

describe('parseLegacyDateTime', () => {
	it('reads a MySQL datetime as UTC', () => {
		expect(parseLegacyDateTime('2020-09-04 21:57:18')).toEqual(new Date('2020-09-04T21:57:18.000Z'))
	})

	it.each([null, '', '0000-00-00', '2020-09-04T21:57:18Z', 'yesterday'])('has no date for %j', (value) => {
		expect(parseLegacyDateTime(value)).toBeNull()
	})
})

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
		expect(references.find((reference) => reference.table === 'sh_fix_repair')?.userIds).toEqual([])
		expect(references.some((reference) => reference.table === 'unrelated_table')).toBe(false)
	})

	it('answers with empty lists when the dump has no user statements', async () => {
		const source = new MysqlDumpUserSource(buildDump())

		expect(await source.readUsers()).toEqual([])
		expect(await source.readUserRoles()).toEqual([])
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
		await expect(read).rejects.not.toThrow(/secret/)
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
