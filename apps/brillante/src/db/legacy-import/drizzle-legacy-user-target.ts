import { sql } from 'drizzle-orm'
import { randomBytes } from 'node:crypto'
import type { DrizzleTransaction } from '../../api/helpers/drizzle-postgres-connector'
import { authentication } from '../schema/authentication'
import { role } from '../schema/role'
import { user, userRole } from '../schema/user'
import type { LegacyUserImportTarget } from './legacy-user-import'
import type { ImportedUserRecord } from './legacy-user-mapper'
import type { ExistingUser } from './legacy-user-plan'

/**
 * Users created after the import get ids from this value up, so they never reuse a legacy user id: the legacy
 * database stays authoritative for the other modules during the migration and its ids go up to 49.
 */
export const FIRST_NEW_USER_ID = 1000

/**
 * `LegacyUserImportTarget` over a Drizzle transaction. Everything runs in the caller's transaction, so a failure
 * anywhere leaves the database as it was.
 */
export class DrizzleLegacyUserImportTarget implements LegacyUserImportTarget {
	/**
	 * @param tx the transaction to read and write through
	 * @param hashPassword hashes the throwaway secret that stands in for each imported user's password
	 */
	constructor(
		private readonly tx: DrizzleTransaction,
		private readonly hashPassword: (plain: string) => Promise<string>,
	) {}

	/** Takes a transaction-scoped advisory lock (key "IMPU" in hex, distinct from the app's other lock keys). */
	public async acquireImportLock(): Promise<void> {
		const importUsersLockKey = 0x494d5055
		await this.tx.execute(sql`SELECT pg_advisory_xact_lock(${importUsersLockKey})`)
	}

	public async readExistingUsers(): Promise<readonly ExistingUser[]> {
		return this.tx.select({ id: user.id, email: user.email }).from(user)
	}

	public async readRoleIds(): Promise<readonly number[]> {
		return (await this.tx.select({ id: role.id }).from(role)).map((row) => row.id)
	}

	/**
	 * Creates the users with their legacy ids, their role, and an authentication row whose password hash is of a random
	 * secret nobody ever sees, with `mustChangePassword` set: the only way in is the password reset flow. Then moves
	 * the user id sequence to `FIRST_NEW_USER_ID`, without ever lowering it.
	 */
	public async writeUsers(records: readonly ImportedUserRecord[]): Promise<void> {
		if (records.length === 0) return
		await this.tx.insert(user).values(records.map(toUserValues))
		await this.tx.insert(userRole).values(records.map((record) => ({ userId: record.legacyId, roleId: record.roleId })))
		await this.tx.insert(authentication).values(await this.unusableCredentials(records))
		await this.advanceUserIdSequence()
	}

	private async unusableCredentials(
		records: readonly ImportedUserRecord[],
	): Promise<(typeof authentication.$inferInsert)[]> {
		return Promise.all(
			records.map(async (record) => ({
				userId: record.legacyId,
				passwordHash: await this.hashPassword(randomBytes(32).toString('base64url')),
				mustChangePassword: true,
			})),
		)
	}

	/**
	 * Moves the id sequence to `FIRST_NEW_USER_ID - 1` so the next user gets `FIRST_NEW_USER_ID`, never lowering it:
	 * it is read by name, together with the highest id, and the target is the largest of the three. `setval` is not
	 * transactional, so a failed commit afterwards leaves a harmless gap.
	 */
	private async advanceUserIdSequence(): Promise<void> {
		const [row] = (
			await this.tx.execute(
				sql`SELECT (SELECT COALESCE(MAX(id), 0) FROM public."user") AS max_id, last_value FROM public.user_id_seq`,
			)
		).rows as { max_id: string | number; last_value: string | number }[]
		const target = Math.max(Number(row.max_id), FIRST_NEW_USER_ID - 1, Number(row.last_value))
		await this.tx.execute(sql`SELECT setval('public.user_id_seq', ${target})`)
	}
}

function toUserValues(record: ImportedUserRecord): typeof user.$inferInsert {
	return {
		id: record.legacyId,
		firstName: record.firstName,
		lastName: record.lastName,
		email: record.email,
		status: record.status,
		statusChangedAt: record.statusChangedAt,
		deletedAt: record.deletedAt,
		...(record.createdAt ? { createdAt: record.createdAt } : {}),
		...(record.updatedAt ? { updatedAt: record.updatedAt } : {}),
	}
}
