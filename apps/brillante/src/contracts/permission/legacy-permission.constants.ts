/**
 * Brillante authorisation catalogue. The backend authorises through numeric roles, so each
 * permission identifier (module:resource:action) maps to the roles allowed to hold it; the
 * frontend derives `User.hasPermission()` from that mapping.
 */
export const UserRole = Object.freeze({
	ADMIN: 1,
	OWNER: 2,
	COUNTER_CLERK: 3,
	REPAIRMAN: 4,
	CUSTOMER: 5,
	EMPLOYEE: 6,
	ACCOUNTANT: 7,
} as const)

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const Permission = Object.freeze({
	REPAIRS_READ: 'repairs:repair:read',
	REPAIRS_MANAGE: 'repairs:repair:manage',
	CLIENTS_READ: 'clients:client:read',
	CLIENTS_MANAGE: 'clients:client:manage',
	CASH_READ: 'cash:transaction:read',
	CASH_MANAGE: 'cash:transaction:manage',
	REPORTS_CASH_READ: 'reports:cash:read',
	SETTINGS_OFFICE_BRANCHES_MANAGE: 'settings:office_branch:manage',
	SETTINGS_USERS_MANAGE: 'settings:user:manage',
	SETTINGS_CASH_CONCEPTS_MANAGE: 'settings:cash_concept:manage',
} as const)

export type Permission = (typeof Permission)[keyof typeof Permission]

export interface PermissionDefinition {
	readonly identifier: Permission
	readonly description: string
	readonly roles: readonly UserRole[]
}

const { ADMIN, OWNER, COUNTER_CLERK, REPAIRMAN, EMPLOYEE, ACCOUNTANT } = UserRole

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
	{
		identifier: Permission.REPAIRS_READ,
		description: 'View repairs',
		roles: [ADMIN, OWNER, COUNTER_CLERK, REPAIRMAN, EMPLOYEE],
	},
	{
		identifier: Permission.REPAIRS_MANAGE,
		description: 'Create, update and delete repairs',
		roles: [ADMIN, OWNER, COUNTER_CLERK, REPAIRMAN, EMPLOYEE],
	},
	{ identifier: Permission.CLIENTS_READ, description: 'View clients', roles: [ADMIN, OWNER, COUNTER_CLERK] },
	{
		identifier: Permission.CLIENTS_MANAGE,
		description: 'Create and update clients',
		roles: [ADMIN, OWNER, COUNTER_CLERK],
	},
	{
		identifier: Permission.CASH_READ,
		description: 'View cash transactions',
		roles: [ADMIN, OWNER, COUNTER_CLERK, EMPLOYEE],
	},
	{
		identifier: Permission.CASH_MANAGE,
		description: 'Create, update and delete cash transactions',
		roles: [ADMIN, OWNER, COUNTER_CLERK, EMPLOYEE],
	},
	{ identifier: Permission.REPORTS_CASH_READ, description: 'View cash reports', roles: [ADMIN, OWNER, ACCOUNTANT] },
	{
		identifier: Permission.SETTINGS_OFFICE_BRANCHES_MANAGE,
		description: 'Manage office branches',
		roles: [ADMIN, OWNER, COUNTER_CLERK],
	},
	{
		identifier: Permission.SETTINGS_USERS_MANAGE,
		description: 'Manage users',
		roles: [ADMIN],
	},
	{
		identifier: Permission.SETTINGS_CASH_CONCEPTS_MANAGE,
		description: 'Manage cash transaction concepts',
		roles: [ADMIN, OWNER, COUNTER_CLERK, REPAIRMAN, EMPLOYEE],
	},
]
