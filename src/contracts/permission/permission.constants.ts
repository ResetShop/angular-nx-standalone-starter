/**
 * Permission identifiers using the 3-part format (module:resource:action).
 *
 * Single source of truth for both backend middleware (requirePermission)
 * and frontend authorization (route guards, sidebar filtering, button visibility).
 *
 * To add a new permission:
 * 1. Add the identifier to the appropriate group below
 * 2. Add its description to PERMISSION_DESCRIPTIONS
 * 3. Run the seed script — PERMISSIONS_SEED_DATA derives everything else automatically
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

/**
 * Human-readable descriptions for each permission, used in DB seeding and UI display.
 */
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
	[ADMIN_PERMISSION_PERMISSIONS.READ]: 'View all system permissions',
	[ADMIN_USER_PERMISSIONS.CREATE]: 'Create new users',
	[ADMIN_USER_PERMISSIONS.READ]: 'View user details',
	[ADMIN_USER_PERMISSIONS.UPDATE]: 'Update user information',
	[ADMIN_USER_PERMISSIONS.DELETE]: 'Delete users',
	[ADMIN_USER_PERMISSIONS.RESET_PASSWORD]: 'Reset user passwords',
	[ADMIN_USER_PERMISSIONS.DISABLE]: 'Manage user account status',
	[ADMIN_ROLE_PERMISSIONS.CREATE]: 'Create new roles',
	[ADMIN_ROLE_PERMISSIONS.READ]: 'View role details',
	[ADMIN_ROLE_PERMISSIONS.UPDATE]: 'Update roles',
	[ADMIN_ROLE_PERMISSIONS.DELETE]: 'Delete roles',
	[ADMIN_USER_ROLE_PERMISSIONS.READ]: 'View user role assignments',
	[ADMIN_USER_ROLE_PERMISSIONS.ASSIGN]: 'Assign roles to users',
	[ADMIN_USER_ROLE_PERMISSIONS.REMOVE]: 'Remove roles from users',
}

/**
 * Parses a 3-part permission identifier into its components.
 */
function parseIdentifier(identifier: string): { module: string; resource: string; action: string } {
	const [module, resource, action] = identifier.split(':')
	return { module, resource, action }
}

/**
 * All permission definitions for DB seeding.
 * Derived from the grouped constants above — module, resource, and action
 * are parsed from the identifier, descriptions come from PERMISSION_DESCRIPTIONS.
 */
export const PERMISSIONS_SEED_DATA = Object.entries(PERMISSION_DESCRIPTIONS).map(([identifier, description]) => ({
	name: identifier,
	description,
	...parseIdentifier(identifier),
}))
