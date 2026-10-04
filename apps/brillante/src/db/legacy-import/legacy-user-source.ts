/**
 * What the importer reads from the legacy database. The interface keeps the importer independent of where the
 * rows come from (today a MySQL dump on the operator's machine; a live MySQL connection would be another
 * implementation). Personal data lives in these rows: nothing that consumes them may log their values.
 */

export interface LegacyUserRow {
	readonly id: number
	readonly firstName: string
	readonly lastName: string
	/** `null` for the users the legacy database stores without an email. */
	readonly email: string | null
	readonly enabled: boolean
	readonly deleted: boolean
	/** MySQL `datetime` values have no zone; they are read as UTC. */
	readonly createdAt: Date | null
	readonly updatedAt: Date | null
}

export interface LegacyUserRoleRow {
	readonly userId: number
	readonly roleId: number
	readonly enabled: boolean
	readonly deleted: boolean
}

/** Every value one legacy column holds, to find out which users the other legacy tables still point at. */
export interface LegacyUserReferenceColumn {
	readonly table: string
	readonly column: string
	/** One entry per row of the table; `null` where the column is NULL. */
	readonly userIds: readonly (number | null)[]
}

/** The legacy columns that hold a user id, by table. */
export const LEGACY_USER_REFERENCES: readonly { readonly table: string; readonly column: string }[] = Object.freeze([
	{ table: 'sh_cash_transaction', column: 'created_user_id' },
	{ table: 'sh_fix_repair_status_history', column: 'modified_user_id' },
	{ table: 'sh_fix_repair', column: 'usuario_creador' },
	{ table: 'sh_fix_repair', column: 'usuario_modificador' },
	{ table: 'sh_fix_customer', column: 'created_by' },
	{ table: 'sh_fix_customer', column: 'updated_by' },
])

export interface LegacyUserSource {
	readUsers(): Promise<readonly LegacyUserRow[]>
	readUserRoles(): Promise<readonly LegacyUserRoleRow[]>
	readUserReferences(): Promise<readonly LegacyUserReferenceColumn[]>
}
