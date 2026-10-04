/**
 * Builders of fabricated legacy dump text for the importer specs. Every name, email and id here is invented:
 * no fixture may ever be derived from the real dump.
 */

const USER_COLUMNS = [
	'id',
	'first_name',
	'last_name',
	'user_name',
	'avatar',
	'created_at',
	'updated_at',
	'enabled',
	'deleted',
	'email',
	'has_finished_registration',
] as const

export interface FakeLegacyUser {
	id: number
	firstName: string
	lastName: string
	email: string | null
	enabled?: boolean
	deleted?: boolean
	createdAt?: string
	updatedAt?: string
}

export interface FakeLegacyUserRole {
	userId: number
	roleId: number
	enabled?: boolean
	deleted?: boolean
}

/** MySQL string syntax: a backslash escapes the quote and the backslash itself. */
function quote(value: string | null): string {
	return value === null ? 'NULL' : `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
}

function flag(value: boolean | undefined, fallback: boolean): string {
	return (value ?? fallback) ? '1' : '0'
}

export function buildUserInsert(users: readonly FakeLegacyUser[]): string {
	const tuples = users.map(
		(user) =>
			`\t(${user.id}, ${quote(user.firstName)}, ${quote(user.lastName)}, ${quote(`user${user.id}`)}, NULL, ` +
			`${quote(user.createdAt ?? '2020-01-02 03:04:05')}, ${quote(user.updatedAt ?? '2021-06-07 08:09:10')}, ` +
			`${flag(user.enabled, true)}, ${flag(user.deleted, false)}, ${quote(user.email)}, 1)`,
	)
	const columns = USER_COLUMNS.map((column) => `\`${column}\``).join(', ')
	return `INSERT INTO \`user\` (${columns}) VALUES\n${tuples.join(',\n')};\n`
}

export function buildUserRoleInsert(userRoles: readonly FakeLegacyUserRole[]): string {
	const tuples = userRoles.map(
		(userRole) =>
			`\t(${userRole.userId}, ${userRole.roleId}, '2020-01-02 03:04:05', '2020-01-02 03:04:05', ` +
			`${flag(userRole.enabled, true)}, ${flag(userRole.deleted, false)})`,
	)
	return (
		'INSERT INTO `user_role` (`id_user`, `id_role`, `created_at`, `updated_at`, `enabled`, `deleted`) VALUES\n' +
		`${tuples.join(',\n')};\n`
	)
}

/** One reference table with a single user-id column, e.g. `sh_cash_transaction.created_user_id`. */
export function buildReferenceInsert(table: string, column: string, userIds: readonly (number | null)[]): string {
	const tuples = userIds.map((userId, index) => `\t(${index + 1}, ${userId === null ? 'NULL' : userId})`)
	return `INSERT INTO \`${table}\` (\`id\`, \`${column}\`) VALUES\n${tuples.join(',\n')};\n`
}

export function buildDump(...statements: string[]): string {
	return `-- Auto-generated dump from MySQL. Do not edit.\n-- Generated: 2026-01-01T00:00:00.000Z\n\n${statements.join('\n')}`
}
