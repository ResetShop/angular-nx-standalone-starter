import { UserRole } from '@contracts/permission/permission.constants'
import type { AppTranslationKey } from '@providers/i18n/app-translations'

export interface UserRoleOption {
	readonly id: UserRole
	/** Name the backend stores for the role; sent as the role description when assigning it. */
	readonly description: string
	readonly labelKey: AppTranslationKey
}

/**
 * Roles that can be assigned from the user management screen, in the order they are offered.
 */
export const USER_ROLE_OPTIONS: readonly UserRoleOption[] = Object.freeze([
	{ id: UserRole.ADMIN, description: 'ADMIN', labelKey: 'MANAGED_USERS.ROLES.ADMIN' },
	{ id: UserRole.OWNER, description: 'OWNER', labelKey: 'MANAGED_USERS.ROLES.OWNER' },
	{ id: UserRole.COUNTER_CLERK, description: 'COUNTER_CLERK', labelKey: 'MANAGED_USERS.ROLES.COUNTER_CLERK' },
	{ id: UserRole.REPAIRMAN, description: 'REPAIRMAN', labelKey: 'MANAGED_USERS.ROLES.REPAIRMAN' },
	{ id: UserRole.CUSTOMER, description: 'CUSTOMER', labelKey: 'MANAGED_USERS.ROLES.CUSTOMER' },
	{ id: UserRole.EMPLOYEE, description: 'EMPLOYEE', labelKey: 'MANAGED_USERS.ROLES.EMPLOYEE' },
	{ id: UserRole.ACCOUNTANT, description: 'ACCOUNTANT', labelKey: 'MANAGED_USERS.ROLES.ACCOUNTANT' },
])
