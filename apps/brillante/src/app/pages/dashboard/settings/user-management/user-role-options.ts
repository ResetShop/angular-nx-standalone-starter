import { UserRole } from '@contracts/permission/legacy-permission.constants'
import type { AppTranslationKey } from '@providers/i18n/app-translations'

export interface UserRoleOption {
	readonly id: UserRole
	readonly labelKey: AppTranslationKey
}

/**
 * Roles that can be assigned from the user management screen, in the order they are offered.
 */
export const USER_ROLE_OPTIONS: readonly UserRoleOption[] = Object.freeze([
	{ id: UserRole.ADMIN, labelKey: 'MANAGED_USERS.ROLES.ADMIN' },
	{ id: UserRole.OWNER, labelKey: 'MANAGED_USERS.ROLES.OWNER' },
	{ id: UserRole.COUNTER_CLERK, labelKey: 'MANAGED_USERS.ROLES.COUNTER_CLERK' },
	{ id: UserRole.REPAIRMAN, labelKey: 'MANAGED_USERS.ROLES.REPAIRMAN' },
	{ id: UserRole.CUSTOMER, labelKey: 'MANAGED_USERS.ROLES.CUSTOMER' },
	{ id: UserRole.EMPLOYEE, labelKey: 'MANAGED_USERS.ROLES.EMPLOYEE' },
	{ id: UserRole.ACCOUNTANT, labelKey: 'MANAGED_USERS.ROLES.ACCOUNTANT' },
])
