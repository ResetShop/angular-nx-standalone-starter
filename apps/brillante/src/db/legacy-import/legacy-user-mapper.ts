import { LEGACY_ROLES, LegacyRoleCode } from '../../contracts/role/legacy-roles'
import { UserStatus } from '../../contracts/user/user.constants'
import type { LegacyUserRoleRow, LegacyUserRow } from './legacy-user-source'

export const LegacyExclusionReason = Object.freeze({
	/** The only active role of the user is Cliente: customers are not migrated with the staff. */
	CUSTOMER_ONLY: 'customer-only',
	NO_ACTIVE_ROLE: 'no-active-role',
	MULTIPLE_ROLES: 'multiple-roles',
	UNKNOWN_ROLE: 'unknown-role',
	/** The operator asked to leave the user out, for example the administrator the seed already created. */
	SKIPPED_BY_OPERATOR: 'skipped-by-operator',
} as const)

export type LegacyExclusionReason = (typeof LegacyExclusionReason)[keyof typeof LegacyExclusionReason]

/** A legacy user ready to be written: the legacy user id and role id are kept as the new ids. */
export interface ImportedUserRecord {
	readonly legacyId: number
	readonly firstName: string
	readonly lastName: string
	readonly email: string
	/** True when the legacy user has no email and `email` is a generated address that must never be mailed. */
	readonly emailIsPlaceholder: boolean
	readonly roleId: number
	readonly status: UserStatus
	readonly statusChangedAt: Date | null
	readonly deletedAt: Date | null
	readonly createdAt: Date | null
	readonly updatedAt: Date | null
}

export type LegacyUserClassification =
	| { readonly kind: 'import'; readonly record: ImportedUserRecord }
	| { readonly kind: 'excluded'; readonly legacyId: number; readonly reason: LegacyExclusionReason }

export interface ClassifyLegacyUsersOptions {
	/** Legacy ids to leave out of the import regardless of their role. */
	readonly skipLegacyUserIds?: readonly number[]
}

/** The address standing in for a missing legacy email. It is unique per user and never deliverable. */
export function placeholderEmail(legacyId: number): string {
	return `no-email-${legacyId}@placeholder.local`
}

function deriveStatus(user: LegacyUserRow): Pick<ImportedUserRecord, 'status' | 'statusChangedAt' | 'deletedAt'> {
	if (user.deleted) {
		return { status: UserStatus.DELETED, statusChangedAt: user.updatedAt, deletedAt: user.updatedAt }
	}
	if (!user.enabled) {
		return { status: UserStatus.DISABLED, statusChangedAt: user.updatedAt, deletedAt: null }
	}
	return { status: UserStatus.ACTIVE, statusChangedAt: null, deletedAt: null }
}

function toRecord(user: LegacyUserRow, roleId: number): ImportedUserRecord {
	const email = user.email?.trim().toLowerCase() ?? ''
	return {
		legacyId: user.id,
		firstName: user.firstName.trim(),
		lastName: user.lastName.trim(),
		email: email === '' ? placeholderEmail(user.id) : email,
		emailIsPlaceholder: email === '',
		roleId,
		createdAt: user.createdAt,
		updatedAt: user.updatedAt,
		...deriveStatus(user),
	}
}

function groupActiveRoleIds(userRoles: readonly LegacyUserRoleRow[]): Map<number, number[]> {
	const byUser = new Map<number, number[]>()
	for (const userRole of userRoles) {
		if (userRole.deleted || !userRole.enabled) continue
		byUser.set(userRole.userId, [...(byUser.get(userRole.userId) ?? []), userRole.roleId])
	}
	return byUser
}

function excluded(legacyId: number, reason: LegacyExclusionReason): LegacyUserClassification {
	return { kind: 'excluded', legacyId, reason }
}

/**
 * Decides, for every legacy user, whether it is imported and as what. In scope are the users whose single active
 * role is any legacy role but Cliente. Dropped on purpose: the legacy user name, the avatar and the
 * has-finished-registration flag, which the new model has no place for.
 */
export function classifyLegacyUsers(
	users: readonly LegacyUserRow[],
	userRoles: readonly LegacyUserRoleRow[],
	options: ClassifyLegacyUsersOptions = {},
): LegacyUserClassification[] {
	const skipped = new Set(options.skipLegacyUserIds ?? [])
	const knownRoleIds = new Set<number>(LEGACY_ROLES.map((legacyRole) => legacyRole.id))
	const customerRoleId = LEGACY_ROLES.find((legacyRole) => legacyRole.code === LegacyRoleCode.CUSTOMER)?.id
	const activeRoleIds = groupActiveRoleIds(userRoles)

	return users.map((user) => {
		const roleIds = activeRoleIds.get(user.id) ?? []
		if (skipped.has(user.id)) return excluded(user.id, LegacyExclusionReason.SKIPPED_BY_OPERATOR)
		if (roleIds.length === 0) return excluded(user.id, LegacyExclusionReason.NO_ACTIVE_ROLE)
		if (roleIds.length > 1) return excluded(user.id, LegacyExclusionReason.MULTIPLE_ROLES)
		const [roleId] = roleIds
		if (!knownRoleIds.has(roleId)) return excluded(user.id, LegacyExclusionReason.UNKNOWN_ROLE)
		if (roleId === customerRoleId) return excluded(user.id, LegacyExclusionReason.CUSTOMER_ONLY)
		return { kind: 'import', record: toRecord(user, roleId) }
	})
}
