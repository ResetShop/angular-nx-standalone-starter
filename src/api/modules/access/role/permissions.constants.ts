import {
	ADMIN_PERMISSION_PERMISSIONS as _ADMIN_PERMISSION_PERMISSIONS,
	ADMIN_ROLE_PERMISSIONS as _ADMIN_ROLE_PERMISSIONS,
	ADMIN_USER_PERMISSIONS as _ADMIN_USER_PERMISSIONS,
	ADMIN_USER_ROLE_PERMISSIONS as _ADMIN_USER_ROLE_PERMISSIONS,
} from '@contracts/permission/permission.constants'
import type { PermissionName } from '../../user/permission-types'

/**
 * Re-exports shared permission identifiers branded as PermissionName
 * for backend middleware type safety. The source of truth is
 * `src/contracts/permission/permission.constants.ts`.
 */
export const ADMIN_PERMISSION_PERMISSIONS = _ADMIN_PERMISSION_PERMISSIONS as {
	readonly [K in keyof typeof _ADMIN_PERMISSION_PERMISSIONS]: PermissionName
}

export const ADMIN_USER_PERMISSIONS = _ADMIN_USER_PERMISSIONS as {
	readonly [K in keyof typeof _ADMIN_USER_PERMISSIONS]: PermissionName
}

export const ADMIN_ROLE_PERMISSIONS = _ADMIN_ROLE_PERMISSIONS as {
	readonly [K in keyof typeof _ADMIN_ROLE_PERMISSIONS]: PermissionName
}

export const ADMIN_USER_ROLE_PERMISSIONS = _ADMIN_USER_ROLE_PERMISSIONS as {
	readonly [K in keyof typeof _ADMIN_USER_ROLE_PERMISSIONS]: PermissionName
}
