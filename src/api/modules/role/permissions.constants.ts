import { permission } from '../user/permission-types';

/**
 * Admin module permissions for permission management.
 */
export const ADMIN_PERMISSION_PERMISSIONS = {
	READ: permission('admin:permissions:read'),
} as const;

/**
 * Admin module permissions for user management.
 */
export const ADMIN_USER_PERMISSIONS = {
	CREATE: permission('admin:users:create'),
	READ: permission('admin:users:read'),
	UPDATE: permission('admin:users:update'),
	DELETE: permission('admin:users:delete'),
	RESET_PASSWORD: permission('admin:users:reset_password'),
	DISABLE: permission('admin:users:disable'),
} as const;

/**
 * Admin module permissions for role management.
 */
export const ADMIN_ROLE_PERMISSIONS = {
	CREATE: permission('admin:roles:create'),
	READ: permission('admin:roles:read'),
	UPDATE: permission('admin:roles:update'),
	DELETE: permission('admin:roles:delete'),
} as const;

/**
 * Admin module permissions for user-role assignment management.
 */
export const ADMIN_USER_ROLE_PERMISSIONS = {
	READ: permission('admin:user_roles:read'),
	ASSIGN: permission('admin:user_roles:assign'),
	REMOVE: permission('admin:user_roles:remove'),
} as const;

/**
 * All admin permission definitions for seeding.
 * Each entry contains the full permission data needed for database insertion.
 */
export const ADMIN_PERMISSIONS_SEED_DATA = [
	// Permission management permissions
	{
		name: ADMIN_PERMISSION_PERMISSIONS.READ,
		description: 'View all system permissions',
		resource: 'permissions',
		action: 'read',
	},
	// User management permissions
	{
		name: ADMIN_USER_PERMISSIONS.CREATE,
		description: 'Create new users',
		resource: 'users',
		action: 'create',
	},
	{
		name: ADMIN_USER_PERMISSIONS.READ,
		description: 'View user details',
		resource: 'users',
		action: 'read',
	},
	{
		name: ADMIN_USER_PERMISSIONS.UPDATE,
		description: 'Update user information',
		resource: 'users',
		action: 'update',
	},
	{
		name: ADMIN_USER_PERMISSIONS.DELETE,
		description: 'Delete users',
		resource: 'users',
		action: 'delete',
	},
	{
		name: ADMIN_USER_PERMISSIONS.RESET_PASSWORD,
		description: 'Reset user passwords',
		resource: 'users',
		action: 'reset_password',
	},
	{
		name: ADMIN_USER_PERMISSIONS.DISABLE,
		description: 'Disable user accounts',
		resource: 'users',
		action: 'disable',
	},
	// Role management permissions
	{
		name: ADMIN_ROLE_PERMISSIONS.CREATE,
		description: 'Create new roles',
		resource: 'roles',
		action: 'create',
	},
	{
		name: ADMIN_ROLE_PERMISSIONS.READ,
		description: 'View role details',
		resource: 'roles',
		action: 'read',
	},
	{
		name: ADMIN_ROLE_PERMISSIONS.UPDATE,
		description: 'Update roles',
		resource: 'roles',
		action: 'update',
	},
	{
		name: ADMIN_ROLE_PERMISSIONS.DELETE,
		description: 'Delete roles',
		resource: 'roles',
		action: 'delete',
	},
	// User-role assignment permissions
	{
		name: ADMIN_USER_ROLE_PERMISSIONS.READ,
		description: 'View user role assignments',
		resource: 'user_roles',
		action: 'read',
	},
	{
		name: ADMIN_USER_ROLE_PERMISSIONS.ASSIGN,
		description: 'Assign roles to users',
		resource: 'user_roles',
		action: 'assign',
	},
	{
		name: ADMIN_USER_ROLE_PERMISSIONS.REMOVE,
		description: 'Remove roles from users',
		resource: 'user_roles',
		action: 'remove',
	},
] as const;
