import { LEGACY_ROLES, LEGACY_ROLES_TO_SEED } from '@contracts/role/legacy-roles'
import { role, rolePermission } from '@schema/role'
import { inArray, sql, TransactionRollbackError } from 'drizzle-orm'
import { seedLegacyRoles } from '../../../db/seed-legacy-roles'
import type { DrizzleTransaction } from '../../helpers/drizzle-postgres-connector'
import { getTestDb } from '../setup/db-helpers'

const highestLegacyId = Math.max(...LEGACY_ROLES.map((legacyRole) => legacyRole.id))

/**
 * Runs `work` in a transaction that is always rolled back, so the shared test database keeps the roles the other
 * suites created. Resolves with what `work` returned, or rejects with the error `work` threw.
 */
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

/** A database that only holds the Administrator role under its legacy id, like a freshly seeded one. */
async function resetToAdministratorOnly(tx: DrizzleTransaction): Promise<void> {
	await tx.delete(role)
	await tx.insert(role).values({ ...LEGACY_ROLES[0] })
}

/** The role id sequence is not transactional: a rollback does not undo `setval`, so specs read it directly. */
async function readRoleSequence(): Promise<{ lastValue: number; isCalled: boolean }> {
	const result = await getTestDb().execute(sql`SELECT last_value, is_called FROM role_id_seq`)
	const row = result.rows[0] as { last_value: string; is_called: boolean }
	return { lastValue: Number(row.last_value), isCalled: row.is_called }
}

describe('seedLegacyRoles', () => {
	let sequenceBefore: { lastValue: number; isCalled: boolean }

	beforeAll(async () => {
		sequenceBefore = await readRoleSequence()
	})

	afterAll(async () => {
		// Leave the sequence exactly where the other suites expect it.
		await getTestDb().execute(
			sql`SELECT setval('role_id_seq', ${sequenceBefore.lastValue}, ${sequenceBefore.isCalled})`,
		)
	})

	it('creates the six legacy roles with their legacy ids and no permissions', async () => {
		const outcome = await inRolledBackTransaction(async (tx) => {
			await resetToAdministratorOnly(tx)
			const result = await seedLegacyRoles(tx)
			const roles = await tx.select().from(role).orderBy(role.id)
			const granted = await tx
				.select({ roleId: rolePermission.roleId })
				.from(rolePermission)
				.where(
					inArray(
						rolePermission.roleId,
						LEGACY_ROLES_TO_SEED.map((legacyRole) => legacyRole.id),
					),
				)
			return { result, roles, granted }
		})

		expect(outcome.result.created).toEqual(LEGACY_ROLES_TO_SEED.map((legacyRole) => legacyRole.code))
		expect(outcome.result.existing).toEqual([])
		expect(outcome.roles.map((row) => [row.id, row.code, row.name, row.removable])).toEqual(
			LEGACY_ROLES.map((legacyRole) => [legacyRole.id, legacyRole.code, legacyRole.name, legacyRole.removable]),
		)
		expect(outcome.granted).toEqual([])
	})

	it('is idempotent', async () => {
		const outcome = await inRolledBackTransaction(async (tx) => {
			await resetToAdministratorOnly(tx)
			await seedLegacyRoles(tx)
			const second = await seedLegacyRoles(tx)
			const count = (await tx.select({ id: role.id }).from(role)).length
			return { second, count }
		})

		expect(outcome.second.created).toEqual([])
		expect(outcome.second.existing).toHaveLength(LEGACY_ROLES_TO_SEED.length)
		expect(outcome.count).toBe(LEGACY_ROLES.length)
	})

	it('moves the id sequence past the legacy ids so later roles do not collide', async () => {
		const before = await readRoleSequence()
		const nextId = await inRolledBackTransaction(async (tx) => {
			await resetToAdministratorOnly(tx)
			await seedLegacyRoles(tx)
			const [created] = await tx.insert(role).values({ name: 'Auditor', code: 'auditor' }).returning({ id: role.id })
			return created.id
		})

		expect(nextId).toBe(Math.max(highestLegacyId, before.lastValue) + 1)
	})

	it('never moves the id sequence backwards', async () => {
		await getTestDb().execute(sql`SELECT setval('role_id_seq', ${highestLegacyId + 500})`)

		await inRolledBackTransaction(async (tx) => {
			await resetToAdministratorOnly(tx)
			await seedLegacyRoles(tx)
		})

		expect((await readRoleSequence()).lastValue).toBe(highestLegacyId + 500)
	})

	it('refuses to run without the Administrator role', async () => {
		await expect(
			inRolledBackTransaction(async (tx) => {
				await tx.delete(role)
				await seedLegacyRoles(tx)
			}),
		).rejects.toThrow(/Administrator role does not exist; run the database seed first/)
	})

	it('refuses to run when the Administrator role has another id', async () => {
		await expect(
			inRolledBackTransaction(async (tx) => {
				await tx.delete(role)
				await tx.insert(role).values({ ...LEGACY_ROLES[0], id: 41 })
				await seedLegacyRoles(tx)
			}),
		).rejects.toThrow(/Administrator role has id 41, expected the legacy id 1/)
	})

	it('fails when a legacy code already exists under a different id', async () => {
		await expect(
			inRolledBackTransaction(async (tx) => {
				await resetToAdministratorOnly(tx)
				await tx.insert(role).values({ id: 40, code: 'owner', name: 'Brillante' })
				await seedLegacyRoles(tx)
			}),
		).rejects.toThrow(/Role "owner" exists with id 40, expected the legacy id 2/)
	})

	it('fails when a legacy id is held by an unrelated role', async () => {
		await expect(
			inRolledBackTransaction(async (tx) => {
				await resetToAdministratorOnly(tx)
				await tx.insert(role).values({ id: 3, code: 'auditor', name: 'Auditor' })
				await seedLegacyRoles(tx)
			}),
		).rejects.toThrow(/Role id 3 is taken by "auditor"; expected "counter_clerk"/)
	})

	it('leaves the roles and grants the test database already had untouched', async () => {
		const snapshot = async () => ({
			roles: await getTestDb().select().from(role).orderBy(role.id),
			grants: await getTestDb().select().from(rolePermission).orderBy(rolePermission.id),
		})
		const before = await snapshot()

		await inRolledBackTransaction(async (tx) => {
			await resetToAdministratorOnly(tx)
			await seedLegacyRoles(tx)
		})

		expect(await snapshot()).toEqual(before)
	})
})
