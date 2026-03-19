/**
 * Frontend permission identifiers using the 2-part format (resource:action).
 *
 * The backend uses 3-part identifiers (module:resource:action, e.g. "admin:users:read"),
 * but the frontend Permission domain model computes identifier as "${resource}:${action}".
 * These constants match the frontend format used by User.hasPermissionByIdentifier().
 */
export const PermissionId = Object.freeze({
	USERS_READ: 'users:read',
	USERS_CREATE: 'users:create',
	USERS_UPDATE: 'users:update',
	USERS_DELETE: 'users:delete',
	ROLES_READ: 'roles:read',
	ROLES_CREATE: 'roles:create',
	ROLES_UPDATE: 'roles:update',
	ROLES_DELETE: 'roles:delete',
	PERMISSIONS_READ: 'permissions:read',
} as const)

export type PermissionId = (typeof PermissionId)[keyof typeof PermissionId]
