import { eq, sql } from 'drizzle-orm'
import type { DrizzleTransaction } from '../api/helpers/drizzle-postgres-connector'
import {
	LEGACY_ROLES,
	LEGACY_ROLES_TO_SEED,
	LegacyRoleCode,
	type LegacyRoleDefinition,
} from '../contracts/role/legacy-roles'
import { role } from './schema/role'

/** Key of the advisory lock that serialises seed runs; it must differ from the other advisory lock keys of the app. */
const SEED_LEGACY_ROLES_LOCK_KEY = 0x53454c52 // "SELR" in hex (Seed LEgacy Roles)

export interface SeedLegacyRolesResult {
	readonly created: readonly string[]
	/** Roles that existed with a different `removable` flag, which was corrected. */
	readonly updated: readonly string[]
	readonly existing: readonly string[]
}

/**
 * Creates one legacy role with its legacy id, or confirms one exists (correcting its `removable` flag, the only
 * property whose meaning changed after the first seed). A role that already
 * holds the code under a different id, or an unrelated role holding the id, means the database has
 * diverged from the legacy numbering; that is an error, never silently skipped, because user import
 * and the frontend rely on the ids.
 */
async function seedLegacyRole(
	tx: DrizzleTransaction,
	definition: LegacyRoleDefinition,
): Promise<'created' | 'updated' | 'existing'> {
	const [byCode] = await tx
		.select({ id: role.id, removable: role.removable })
		.from(role)
		.where(eq(role.code, definition.code))
	if (byCode) {
		if (byCode.id !== definition.id) {
			throw new Error(`Role "${definition.code}" exists with id ${byCode.id}, expected the legacy id ${definition.id}`)
		}
		if (byCode.removable === definition.removable) return 'existing'

		await tx.update(role).set({ removable: definition.removable }).where(eq(role.id, definition.id))
		return 'updated'
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
 * Moves the role id sequence past the highest legacy id without ever lowering it. `pg_sequence_last_value`
 * includes ids already handed out to transactions that have not committed, which `MAX(id)` cannot see, and
 * keeps ids of roles deleted since from being reused.
 */
async function advanceRoleIdSequence(tx: DrizzleTransaction): Promise<void> {
	const highestLegacyId = Math.max(...LEGACY_ROLES.map((legacyRole) => legacyRole.id))
	await tx.execute(sql`
		SELECT setval(
			pg_get_serial_sequence('public.role', 'id'),
			GREATEST(
				(SELECT COALESCE(MAX(id), 0) FROM public.role),
				${highestLegacyId},
				COALESCE(pg_sequence_last_value(pg_get_serial_sequence('public.role', 'id')::regclass), 0)
			)
		)
	`)
}

async function assertAdministratorRole(tx: DrizzleTransaction): Promise<void> {
	const adminDefinition = LEGACY_ROLES.find((legacyRole) => legacyRole.code === LegacyRoleCode.ADMIN)
	if (!adminDefinition) {
		throw new Error('The legacy role definitions have no Administrator')
	}

	const [admin] = await tx.select({ id: role.id }).from(role).where(eq(role.code, adminDefinition.code))
	if (!admin) {
		throw new Error('The Administrator role does not exist; run the database seed first')
	}
	if (admin.id !== adminDefinition.id) {
		throw new Error(`The Administrator role has id ${admin.id}, expected the legacy id ${adminDefinition.id}`)
	}
}

/**
 * Creates the legacy roles 2 to 7 (Owner, Counter clerk, Repairman, Customer, Employee, Accountant) with their
 * legacy ids and no permissions. The Administrator (id 1) belongs to the reference seed and must exist already.
 *
 * Idempotent: running it again changes nothing. Roles seeded earlier as non-removable become removable. A transaction-scoped advisory lock serialises concurrent runs, so
 * the second one sees the roles the first created instead of failing on a unique violation.
 */
export async function seedLegacyRoles(tx: DrizzleTransaction): Promise<SeedLegacyRolesResult> {
	await tx.execute(sql`SELECT pg_advisory_xact_lock(${SEED_LEGACY_ROLES_LOCK_KEY})`)
	await assertAdministratorRole(tx)

	const created: string[] = []
	const updated: string[] = []
	const existing: string[] = []
	for (const definition of LEGACY_ROLES_TO_SEED) {
		const outcome = await seedLegacyRole(tx, definition)
		const bucket = { created, updated, existing }[outcome]
		bucket.push(definition.code)
	}

	await advanceRoleIdSequence(tx)
	return { created, updated, existing }
}
