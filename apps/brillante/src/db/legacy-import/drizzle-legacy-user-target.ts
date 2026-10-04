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

/** Arbitrary constant identifying the import in `pg_advisory_xact_lock`; it must differ from the other lock keys. */
const IMPORT_LEGACY_USERS_LOCK_KEY = 0x494d5055 // "IMPU" in hex (IMport Users)

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
		await this.tx.execute(sql`SELECT pg_advisory_xact_lock(${IMPORT_LEGACY_USERS_LOCK_KEY})`)

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

	private async advanceUserIdSequence(): Promise<void> {
		await this.tx.execute(sql`
			SELECT setval(
				pg_get_serial_sequence('public."user"', 'id'),
				GREATEST(
					(SELECT COALESCE(MAX(id), 0) FROM public."user"),
					${FIRST_NEW_USER_ID - 1},
					COALESCE(pg_sequence_last_value(pg_get_serial_sequence('public."user"', 'id')::regclass), 0)
				)
			)
		`)
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
