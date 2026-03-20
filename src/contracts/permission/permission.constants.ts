/**
 * Permission identifiers using the 3-part format (module:resource:action).
 *
 * Single source of truth for both backend middleware (requirePermission)
 * and frontend authorization (route guards, sidebar filtering, button visibility).
 */

export const ADMIN_PERMISSION_PERMISSIONS = Object.freeze({
	READ: 'admin:permissions:read',
} as const)

export const ADMIN_USER_PERMISSIONS = Object.freeze({
	CREATE: 'admin:users:create',
	READ: 'admin:users:read',
	UPDATE: 'admin:users:update',
	DELETE: 'admin:users:delete',
	RESET_PASSWORD: 'admin:users:reset_password',
	DISABLE: 'admin:users:disable',
} as const)

export const ADMIN_ROLE_PERMISSIONS = Object.freeze({
	CREATE: 'admin:roles:create',
	READ: 'admin:roles:read',
	UPDATE: 'admin:roles:update',
	DELETE: 'admin:roles:delete',
} as const)

export const ADMIN_USER_ROLE_PERMISSIONS = Object.freeze({
	READ: 'admin:user_roles:read',
	ASSIGN: 'admin:user_roles:assign',
	REMOVE: 'admin:user_roles:remove',
} as const)
