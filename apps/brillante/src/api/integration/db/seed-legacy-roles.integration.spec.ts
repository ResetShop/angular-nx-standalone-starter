import { LEGACY_ROLES, LEGACY_ROLES_TO_SEED } from '@contracts/role/legacy-roles'
import { role, rolePermission } from '@schema/role'
import { eq, inArray, TransactionRollbackError } from 'drizzle-orm'
import { seedLegacyRoles } from '../../../db/seed-legacy-roles'
import type { DrizzleTransaction } from '../../helpers/drizzle-postgres-connector'
import { getTestDb } from '../setup/db-helpers'

/**
 * Runs `work` in a transaction that is always rolled back, so the shared test database keeps the roles the other
 * suites created. Resolves with what `work` returned, or rejects with the error `work` threw.
 */
async function inRolledBackTransaction<T>(work: (tx: DrizzleTransaction) => Promise<T>): Promise<T> {
	let result: T | undefined
	await getTestDb()
		.transaction(async (tx) => {
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
	const administrator = LEGACY_ROLES[0]
	await tx.delete(role)
	await tx.insert(role).values({ ...administrator })
}

describe('seedLegacyRoles', () => {
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
		const nextId = await inRolledBackTransaction(async (tx) => {
			await resetToAdministratorOnly(tx)
			await seedLegacyRoles(tx)
			const [created] = await tx.insert(role).values({ name: 'Auditor', code: 'auditor' }).returning({ id: role.id })
			return created.id
		})

		expect(nextId).toBeGreaterThan(Math.max(...LEGACY_ROLES.map((legacyRole) => legacyRole.id)))
	})

	it('refuses to run without the Administrator role under id 1', async () => {
		await expect(
			inRolledBackTransaction(async (tx) => {
				await tx.delete(role)
				await seedLegacyRoles(tx)
			}),
		).rejects.toThrow(/Administrator role must exist with id 1/)
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

	it('leaves the roles the test database already had untouched', async () => {
		const before = await getTestDb().select({ id: role.id }).from(role).where(eq(role.code, 'admin'))

		await inRolledBackTransaction(async (tx) => {
			await resetToAdministratorOnly(tx)
			await seedLegacyRoles(tx)
		})

		const after = await getTestDb().select({ id: role.id }).from(role).where(eq(role.code, 'admin'))
		expect(after).toEqual(before)
	})
})
