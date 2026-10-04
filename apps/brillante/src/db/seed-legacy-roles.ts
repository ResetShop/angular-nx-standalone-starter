import { eq, sql } from 'drizzle-orm'
import type { DrizzleTransaction } from '../api/helpers/drizzle-postgres-connector'
import { LEGACY_ROLES, LEGACY_ROLES_TO_SEED, type LegacyRoleDefinition } from '../contracts/role/legacy-roles'
import { role } from './schema/role'

export interface SeedLegacyRolesResult {
	readonly created: readonly string[]
	readonly existing: readonly string[]
}

/**
 * Creates one legacy role with its legacy id, or confirms an identical one exists. A role that already
 * holds the code under a different id, or an unrelated role holding the id, means the database has
 * diverged from the legacy numbering; that is an error, never silently skipped, because user import
 * and the frontend rely on the ids.
 */
async function seedLegacyRole(
	tx: DrizzleTransaction,
	definition: LegacyRoleDefinition,
): Promise<'created' | 'existing'> {
	const [byCode] = await tx.select({ id: role.id }).from(role).where(eq(role.code, definition.code))
	if (byCode) {
		if (byCode.id !== definition.id) {
			throw new Error(`Role "${definition.code}" exists with id ${byCode.id}, expected the legacy id ${definition.id}`)
		}
		return 'existing'
	}

	const [byId] = await tx.select({ code: role.code }).from(role).where(eq(role.id, definition.id))
	if (byId) {
		throw new Error(`Role id ${definition.id} is taken by "${byId.code}"; expected "${definition.code}"`)
	}

	await tx.insert(role).values({
		id: definition.id,
		name: definition.name,
		code: definition.code,
		description: definition.description,
		removable: definition.removable,
	})
	return 'created'
}

/**
 * Creates the legacy roles 2 to 7 (Owner, Counter clerk, Repairman, Customer, Employee, Accountant) with their
 * legacy ids and no permissions. The Administrator (id 1) belongs to the reference seed and must exist already.
 * Afterwards the id sequence is moved past the highest legacy id, so roles created later never collide.
 *
 * Idempotent: running it again changes nothing.
 */
export async function seedLegacyRoles(tx: DrizzleTransaction): Promise<SeedLegacyRolesResult> {
	const adminDefinition = LEGACY_ROLES[0]
	const [admin] = await tx.select({ id: role.id }).from(role).where(eq(role.code, adminDefinition.code))
	if (!admin || admin.id !== adminDefinition.id) {
		throw new Error(`The Administrator role must exist with id ${adminDefinition.id}; run the database seed first`)
	}

	const created: string[] = []
	const existing: string[] = []
	for (const definition of LEGACY_ROLES_TO_SEED) {
		const outcome = await seedLegacyRole(tx, definition)
		;(outcome === 'created' ? created : existing).push(definition.code)
	}

	const highestLegacyId = Math.max(...LEGACY_ROLES.map((legacyRole) => legacyRole.id))
	await tx.execute(
		sql`SELECT setval(pg_get_serial_sequence('role', 'id'), GREATEST((SELECT MAX(id) FROM role), ${highestLegacyId}))`,
	)

	return { created, existing }
}
