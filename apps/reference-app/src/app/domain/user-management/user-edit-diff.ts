import type { UserStatus } from '@contracts/user/user.constants'
import type { UpdateUserRequest } from '@contracts/user/user.types'
import type { IManagedUser } from './managed-user.interface'

/** The editable facets of a managed user, as held by the edit form. */
export interface UserEditFormModel {
	email: string
	firstName: string
	lastName: string
	roleIds: number[]
	status: UserStatus
}

export const UserEditField = Object.freeze({
	FIRST_NAME: 'firstName',
	LAST_NAME: 'lastName',
	EMAIL: 'email',
	ROLES: 'roles',
	STATUS: 'status',
} as const)

export type UserEditField = (typeof UserEditField)[keyof typeof UserEditField]

/**
 * One changed field. Values are raw (not translated): profile fields verbatim, roles as the
 * alphabetically sorted role names (empty array when none), status as the `UserStatus` value.
 */
export type UserEditChange =
	| { field: 'firstName' | 'lastName' | 'email'; before: string; after: string }
	| { field: 'roles'; before: string[]; after: string[] }
	| { field: 'status'; before: UserStatus; after: UserStatus }

export interface UserEditDiff {
	/** Only the changed fields, ready to send as the single update request. */
	patch: UpdateUserRequest
	/** The changes in display order; empty when nothing changed. */
	changes: UserEditChange[]
}

/**
 * Compares the edited form against the persisted user and returns both the minimal update payload
 * and the before/after change list shown for confirmation. Text fields are compared trimmed; roles
 * are compared as a set, so reordering the same roles is not a change.
 *
 * @param roleNames - Name lookup for every role id the form may contain
 */
export function computeUserEditDiff(
	original: IManagedUser,
	edited: UserEditFormModel,
	roleNames: ReadonlyMap<number, string>,
): UserEditDiff {
	const patch: UpdateUserRequest = {}
	const changes: UserEditChange[] = []

	for (const field of [UserEditField.FIRST_NAME, UserEditField.LAST_NAME, UserEditField.EMAIL] as const) {
		const after = edited[field].trim()
		if (after !== original[field]) {
			patch[field] = after
			changes.push({ field, before: original[field], after })
		}
	}

	const editedRoleIds = [...new Set(edited.roleIds)]
	if (
		!sameMembers(
			original.roles.map((role) => role.id),
			editedRoleIds,
		)
	) {
		patch.roleIds = editedRoleIds
		changes.push({
			field: UserEditField.ROLES,
			before: sortedNames(original.roles.map((role) => role.name)),
			after: sortedNames(editedRoleIds.map((id) => roleNames.get(id) ?? String(id))),
		})
	}

	if (edited.status !== original.status) {
		patch.status = edited.status as UpdateUserRequest['status']
		changes.push({ field: UserEditField.STATUS, before: original.status, after: edited.status })
	}

	return { patch, changes }
}

function sameMembers(a: readonly number[], b: readonly number[]): boolean {
	const setA = new Set(a)
	return setA.size === new Set(b).size && b.every((id) => setA.has(id))
}

function sortedNames(names: string[]): string[] {
	return [...names].sort((x, y) => x.localeCompare(y))
}
