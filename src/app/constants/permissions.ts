/**
 * Frontend permission identifiers using the 3-part format (module:resource:action).
 *
 * These match the backend permission identifiers defined in
 * `src/api/modules/access/role/permissions.constants.ts` and the
 * `Permission.identifier` getter which computes `${module}:${resource}:${action}`.
 */
export const PermissionId = Object.freeze({
	USERS_READ: 'admin:users:read',
	USERS_CREATE: 'admin:users:create',
	USERS_UPDATE: 'admin:users:update',
	USERS_DELETE: 'admin:users:delete',
	ROLES_READ: 'admin:roles:read',
	ROLES_CREATE: 'admin:roles:create',
	ROLES_UPDATE: 'admin:roles:update',
	ROLES_DELETE: 'admin:roles:delete',
	PERMISSIONS_READ: 'admin:permissions:read',
} as const)

export type PermissionId = (typeof PermissionId)[keyof typeof PermissionId]
