import { PERMISSION_DEFINITIONS, type Permission, UserRole } from '../permission/legacy-permission.constants'
import { ADMIN_ROLE_CODE } from './role.constants'

/**
 * Roles carried over from the legacy Brillante user module. Ids 1 to 7 are the legacy role ids and stay
 * stable on purpose: the frontend's interim role-to-permission table (`legacy-permission.constants.ts`)
 * and the legacy API identify roles by them.
 */
export const LegacyRoleCode = Object.freeze({
	ADMIN: ADMIN_ROLE_CODE,
	OWNER: 'owner',
	COUNTER_CLERK: 'counter_clerk',
	REPAIRMAN: 'repairman',
	CUSTOMER: 'customer',
	EMPLOYEE: 'employee',
	ACCOUNTANT: 'accountant',
} as const)

export type LegacyRoleCode = (typeof LegacyRoleCode)[keyof typeof LegacyRoleCode]

export interface LegacyRoleDefinition {
	readonly id: UserRole
	readonly code: LegacyRoleCode
	readonly name: string
	readonly description: string
	readonly removable: boolean
}

/**
 * All seven legacy roles in id order. The Administrator entry mirrors the role created by the reference
 * seed (`src/db/seed.ts`) field for field and cannot be removed. The other six are created by `seedLegacyRoles`
 * as removable: staff change jobs, and a role that is not removable can never be taken off a user.
 */
export const LEGACY_ROLES: readonly LegacyRoleDefinition[] = Object.freeze([
	{
		id: UserRole.ADMIN,
		code: LegacyRoleCode.ADMIN,
		name: 'Administrator',
		description: 'System administrator with full access',
		removable: false,
	},
	{
		id: UserRole.OWNER,
		code: LegacyRoleCode.OWNER,
		name: 'Brillante',
		description: 'Owner of the business',
		removable: true,
	},
	{
		id: UserRole.COUNTER_CLERK,
		code: LegacyRoleCode.COUNTER_CLERK,
		name: 'Encargado Local',
		description: 'Store counter clerk in charge of a branch',
		removable: true,
	},
	{
		id: UserRole.REPAIRMAN,
		code: LegacyRoleCode.REPAIRMAN,
		name: 'Taller',
		description: 'Repair workshop technician',
		removable: true,
	},
	{
		id: UserRole.CUSTOMER,
		code: LegacyRoleCode.CUSTOMER,
		name: 'Cliente',
		description: 'Customer of the store',
		removable: true,
	},
	{
		id: UserRole.EMPLOYEE,
		code: LegacyRoleCode.EMPLOYEE,
		name: 'Empleado',
		description: 'Store employee',
		removable: true,
	},
	{
		id: UserRole.ACCOUNTANT,
		code: LegacyRoleCode.ACCOUNTANT,
		name: 'Contador',
		description: 'Accountant with access to reports',
		removable: true,
	},
])

/** The roles `seedLegacyRoles` creates: every legacy role except the Administrator, which the reference seed owns. */
export const LEGACY_ROLES_TO_SEED: readonly LegacyRoleDefinition[] = Object.freeze(
	LEGACY_ROLES.filter((legacyRole) => legacyRole.code !== LegacyRoleCode.ADMIN),
)

function permissionsOf(roleId: UserRole): readonly Permission[] {
	return PERMISSION_DEFINITIONS.filter((definition) => definition.roles.includes(roleId)).map(
		(definition) => definition.identifier,
	)
}

/**
 * The Brillante domain permissions each legacy role would hold, derived from the frontend's interim table so
 * the two cannot drift (user management is admin-only because it runs on the backend's admin permissions). It is documentation for the future permission catalogue and is NOT applied: the
 * database only knows the `admin:*` permissions, and only the Administrator role is granted any of them.
 * Granting these requires adding them to `PERMISSION_DEFINITIONS` first.
 */
export const LEGACY_ROLE_PERMISSION_MATRIX = Object.freeze({
	[LegacyRoleCode.ADMIN]: permissionsOf(UserRole.ADMIN),
	[LegacyRoleCode.OWNER]: permissionsOf(UserRole.OWNER),
	[LegacyRoleCode.COUNTER_CLERK]: permissionsOf(UserRole.COUNTER_CLERK),
	[LegacyRoleCode.REPAIRMAN]: permissionsOf(UserRole.REPAIRMAN),
	[LegacyRoleCode.CUSTOMER]: permissionsOf(UserRole.CUSTOMER),
	[LegacyRoleCode.EMPLOYEE]: permissionsOf(UserRole.EMPLOYEE),
	[LegacyRoleCode.ACCOUNTANT]: permissionsOf(UserRole.ACCOUNTANT),
} satisfies Record<LegacyRoleCode, readonly Permission[]>)
