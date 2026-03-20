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

/**
 * All admin permission definitions for seeding.
 * Each entry contains the full permission data needed for database insertion.
 */
export const ADMIN_PERMISSIONS_SEED_DATA = [
	// Permission management permissions
	{
		name: ADMIN_PERMISSION_PERMISSIONS.READ,
		description: 'View all system permissions',
		module: 'admin',
		resource: 'permissions',
		action: 'read',
	},
	// User management permissions
	{
		name: ADMIN_USER_PERMISSIONS.CREATE,
		description: 'Create new users',
		module: 'admin',
		resource: 'users',
		action: 'create',
	},
	{
		name: ADMIN_USER_PERMISSIONS.READ,
		description: 'View user details',
		module: 'admin',
		resource: 'users',
		action: 'read',
	},
	{
		name: ADMIN_USER_PERMISSIONS.UPDATE,
		description: 'Update user information',
		module: 'admin',
		resource: 'users',
		action: 'update',
	},
	{
		name: ADMIN_USER_PERMISSIONS.DELETE,
		description: 'Delete users',
		module: 'admin',
		resource: 'users',
		action: 'delete',
	},
	{
		name: ADMIN_USER_PERMISSIONS.RESET_PASSWORD,
		description: 'Reset user passwords',
		module: 'admin',
		resource: 'users',
		action: 'reset_password',
	},
	{
		name: ADMIN_USER_PERMISSIONS.DISABLE,
		description: 'Manage user account status',
		module: 'admin',
		resource: 'users',
		action: 'disable',
	},
	// Role management permissions
	{
		name: ADMIN_ROLE_PERMISSIONS.CREATE,
		description: 'Create new roles',
		module: 'admin',
		resource: 'roles',
		action: 'create',
	},
	{
		name: ADMIN_ROLE_PERMISSIONS.READ,
		description: 'View role details',
		module: 'admin',
		resource: 'roles',
		action: 'read',
	},
	{
		name: ADMIN_ROLE_PERMISSIONS.UPDATE,
		description: 'Update roles',
		module: 'admin',
		resource: 'roles',
		action: 'update',
	},
	{
		name: ADMIN_ROLE_PERMISSIONS.DELETE,
		description: 'Delete roles',
		module: 'admin',
		resource: 'roles',
		action: 'delete',
	},
	// User-role assignment permissions
	{
		name: ADMIN_USER_ROLE_PERMISSIONS.READ,
		description: 'View user role assignments',
		module: 'admin',
		resource: 'user_roles',
		action: 'read',
	},
	{
		name: ADMIN_USER_ROLE_PERMISSIONS.ASSIGN,
		description: 'Assign roles to users',
		module: 'admin',
		resource: 'user_roles',
		action: 'assign',
	},
	{
		name: ADMIN_USER_ROLE_PERMISSIONS.REMOVE,
		description: 'Remove roles from users',
		module: 'admin',
		resource: 'user_roles',
		action: 'remove',
	},
] as const
