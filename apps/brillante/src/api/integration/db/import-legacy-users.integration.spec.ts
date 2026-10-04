import { LEGACY_ROLES } from '@contracts/role/legacy-roles'
import { UserStatus } from '@contracts/user/user.constants'
import { authentication } from '@schema/authentication'
import { role } from '@schema/role'
import { user, userRole } from '@schema/user'
import { eq, sql, TransactionRollbackError } from 'drizzle-orm'
import { DrizzleLegacyUserImportTarget, FIRST_NEW_USER_ID } from '../../../db/legacy-import/drizzle-legacy-user-target'
import {
	buildDump,
	buildReferenceInsert,
	buildUserInsert,
	buildUserRoleInsert,
} from '../../../db/legacy-import/legacy-dump.testing'
import { LegacyUserImportConflictError, runLegacyUserImport } from '../../../db/legacy-import/legacy-user-import'
import { MysqlDumpUserSource } from '../../../db/legacy-import/mysql-dump-user-source'
import { seedLegacyRoles } from '../../../db/seed-legacy-roles'
import type { DrizzleTransaction } from '../../helpers/drizzle-postgres-connector'
import { createPasswordHasher, createPasswordVerifier } from '../../services/password/password-hasher'
import { getTestDb } from '../setup/db-helpers'

/** An invented legacy database: an administrator, three staff users (one disabled, without email) and a customer. */
const dump = buildDump(
	buildUserInsert([
		{ id: 1, firstName: 'Ada', lastName: 'Admin', email: 'admin@example.test' },
		{ id: 2, firstName: 'Omar', lastName: 'Owner', email: '  Owner@Example.Test ', createdAt: '2020-03-04 05:06:07' },
		{ id: 3, firstName: 'Eli', lastName: 'Staff', email: null, enabled: false, updatedAt: '2022-08-09 10:11:12' },
		{ id: 4, firstName: 'Cora', lastName: 'Clerk', email: 'clerk@example.test', deleted: true },
		{ id: 9, firstName: 'Cleo', lastName: 'Customer', email: 'customer@example.test' },
	]),
	buildUserRoleInsert([
		{ userId: 1, roleId: 1 },
		{ userId: 2, roleId: 2 },
		{ userId: 3, roleId: 6 },
		{ userId: 4, roleId: 3 },
		{ userId: 9, roleId: 5 },
	]),
	buildReferenceInsert('sh_cash_transaction', 'created_user_id', [1, 2, 9]),
	buildReferenceInsert('sh_fix_repair_status_history', 'modified_user_id', [3]),
	buildReferenceInsert('sh_fix_repair', 'usuario_creador', [2]),
	buildReferenceInsert('sh_fix_repair', 'usuario_modificador', [null]),
	buildReferenceInsert('sh_fix_customer', 'created_by', [null]),
	buildReferenceInsert('sh_fix_customer', 'updated_by', [null]),
)

/** Runs `work` in a transaction that is always rolled back, so the shared test database is left as it was. */
async function inRolledBackTransaction<T>(work: (tx: DrizzleTransaction) => Promise<T>): Promise<T> {
	let result: T | undefined
	await getTestDb()
		.transaction(async (tx) => {
			// REASON: the test database client is built with a subset of the schema, which makes its transaction type
			// nominally different from the connector's; both run the same queries against the same tables.
			result = await work(tx as unknown as DrizzleTransaction)
			tx.rollback()
		})
		.catch((error: unknown) => {
			if (!(error instanceof TransactionRollbackError)) throw error
		})
	return result as T
}

/** A database seeded like production: only the Administrator user (id 1) and the Administrator role, then the legacy roles. */
async function seedLikeProduction(tx: DrizzleTransaction): Promise<void> {
	// TRUNCATE is transactional in PostgreSQL: the rollback restores every table.
	await tx.execute(sql`
		TRUNCATE TABLE
			role_history, role_permission_history, user_profile_history, user_role_history, user_status_history,
			permission_route, role_permission, user_role, refresh_token, password_reset_token, authentication, role, "user"
		CASCADE
	`)
	await tx.insert(role).values({ ...LEGACY_ROLES[0] })
	await seedLegacyRoles(tx)
	await tx.insert(user).values({ id: 1, firstName: 'Seeded', lastName: 'Admin', email: 'admin@brillantestore.example' })
	await tx.insert(userRole).values({ userId: 1, roleId: 1 })
}

function importWith(tx: DrizzleTransaction, dryRun: boolean) {
	return runLegacyUserImport(
		new MysqlDumpUserSource(dump),
		new DrizzleLegacyUserImportTarget(tx, createPasswordHasher()),
		{
			dryRun,
			alreadyProvisionedLegacyUserIds: [1],
		},
	)
}

async function readSequence(): Promise<number> {
	const result = await getTestDb().execute(sql`SELECT last_value FROM user_id_seq`)
	return Number((result.rows[0] as { last_value: string }).last_value)
}

describe('legacy user import into PostgreSQL', () => {
	let sequenceBefore: { lastValue: number; isCalled: boolean }

	beforeAll(async () => {
		const result = await getTestDb().execute(sql`SELECT last_value, is_called FROM user_id_seq`)
		const row = result.rows[0] as { last_value: string; is_called: boolean }
		sequenceBefore = { lastValue: Number(row.last_value), isCalled: row.is_called }
	})

	afterAll(async () => {
		// The sequence is not transactional; leave it where the other suites expect it.
		await getTestDb().execute(
			sql`SELECT setval('user_id_seq', ${sequenceBefore.lastValue}, ${sequenceBefore.isCalled})`,
		)
	})

	it('creates the staff users with their legacy ids, roles and statuses and leaves the seeded administrator alone', async () => {
		const outcome = await inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			const result = await importWith(tx, false)
			const users = await tx.select().from(user).orderBy(user.id)
			const roles = await tx.select().from(userRole).orderBy(userRole.userId)
			return { result, users, roles }
		})

		expect(outcome.result.written).toBe(3)
		expect(outcome.users.map((row) => [row.id, row.email, row.status])).toEqual([
			[1, 'admin@brillantestore.example', UserStatus.ACTIVE],
			[2, 'owner@example.test', UserStatus.ACTIVE],
			[3, 'no-email-3@placeholder.local', UserStatus.DISABLED],
			[4, 'clerk@example.test', UserStatus.DELETED],
		])
		expect(outcome.users[0].firstName).toBe('Seeded')
		expect(outcome.roles.map((row) => [row.userId, row.roleId])).toEqual([
			[1, 1],
			[2, 2],
			[3, 6],
			[4, 3],
		])
	})

	it('keeps the legacy timestamps and the status change moment', async () => {
		const users = await inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			await importWith(tx, false)
			return tx.select().from(user).orderBy(user.id)
		})

		expect(users[1].createdAt).toEqual(new Date('2020-03-04T05:06:07.000Z'))
		expect(users[2].statusChangedAt).toEqual(new Date('2022-08-09T10:11:12.000Z'))
		expect(users[3].deletedAt).not.toBeNull()
		expect(users[1].deletedAt).toBeNull()
	})

	it('gives every imported user a random password nobody knows and forces a change', async () => {
		const verify = createPasswordVerifier()
		const rows = await inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			await importWith(tx, false)
			return tx.select().from(authentication).orderBy(authentication.userId)
		})

		expect(rows.map((row) => row.userId)).toEqual([2, 3, 4])
		expect(rows.every((row) => row.mustChangePassword)).toBe(true)
		expect(new Set(rows.map((row) => row.passwordHash)).size).toBe(3)
		for (const row of rows) {
			for (const guess of ['', 'password', 'Password1!', 'admin@example.test', 'changeme']) {
				expect(await verify(guess, row.passwordHash)).toBe(false)
			}
		}
	})

	it('moves the user id sequence to 1000 so later users never reuse a legacy id', async () => {
		const nextId = await inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			await importWith(tx, false)
			const [created] = await tx
				.insert(user)
				.values({ firstName: 'New', lastName: 'Person', email: 'new@example.test' })
				.returning({ id: user.id })
			return created.id
		})

		expect(nextId).toBeGreaterThanOrEqual(FIRST_NEW_USER_ID)
	})

	it('never moves the sequence backwards', async () => {
		await getTestDb().execute(sql`SELECT setval('user_id_seq', ${FIRST_NEW_USER_ID + 500})`)

		await inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			await importWith(tx, false)
		})

		expect(await readSequence()).toBe(FIRST_NEW_USER_ID + 500)
	})

	it('writes nothing on a dry run', async () => {
		const outcome = await inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			const result = await importWith(tx, true)
			return { result, users: await tx.select({ id: user.id }).from(user) }
		})

		expect(outcome.result.written).toBe(0)
		expect(outcome.result.report).toContain('create: 3')
		expect(outcome.users).toEqual([{ id: 1 }])
	})

	it('is idempotent: a second run finds everything unchanged and writes nothing', async () => {
		const second = await inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			await importWith(tx, false)
			return importWith(tx, false)
		})

		expect(second.written).toBe(0)
		expect(second.report).toContain('unchanged: 3')
	})

	it('refuses to import over a user that already holds a legacy id, and changes nothing', async () => {
		const attempt = inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			await tx.insert(user).values({ id: 2, firstName: 'Other', lastName: 'Person', email: 'other@example.test' })
			return importWith(tx, false)
		})

		await expect(attempt).rejects.toBeInstanceOf(LegacyUserImportConflictError)
		await expect(attempt).rejects.toThrow(/legacy id 2: id-taken-by-other-email/)
	})

	it('refuses to run before the legacy roles are seeded', async () => {
		const attempt = inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			await tx.delete(role).where(eq(role.id, 2))
			return importWith(tx, false)
		})

		await expect(attempt).rejects.toThrow(/no role with id 2; run the roles seed first/)
	})

	it('leaves the users the test database already had untouched', async () => {
		const snapshot = async () => getTestDb().select({ id: user.id, email: user.email }).from(user).orderBy(user.id)
		const before = await snapshot()

		await inRolledBackTransaction(async (tx) => {
			await seedLikeProduction(tx)
			await importWith(tx, false)
		})

		expect(await snapshot()).toEqual(before)
	})
})
