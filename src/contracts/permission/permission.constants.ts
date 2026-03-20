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

// ============================================================================
// Branded type
// ============================================================================

/**
 * Branded type for permission identifiers in module:resource:action format.
 * Ensures compile-time safety when passing identifiers to backend middleware.
 */
export type PermissionName = string & { readonly __brand: 'PermissionName' }

const PERMISSION_PATTERN = /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/

/**
 * Validates and brands a permission identifier string.
 * @throws Error if format is invalid
 */
export function permission(name: string): PermissionName {
	if (!PERMISSION_PATTERN.test(name)) {
		throw new Error(
			`Invalid permission name: "${name}". Must be in module:resource:action format (e.g., 'admin:users:create')`,
		)
	}
	return name as PermissionName
}

// ============================================================================
// Permission groups
// ============================================================================

export const ADMIN_PERMISSION_PERMISSIONS = Object.freeze({
	READ: permission('admin:permissions:read'),
} as const)

export const ADMIN_USER_PERMISSIONS = Object.freeze({
	CREATE: permission('admin:users:create'),
	READ: permission('admin:users:read'),
	UPDATE: permission('admin:users:update'),
	DELETE: permission('admin:users:delete'),
	RESET_PASSWORD: permission('admin:users:reset_password'),
	DISABLE: permission('admin:users:disable'),
} as const)

export const ADMIN_ROLE_PERMISSIONS = Object.freeze({
	CREATE: permission('admin:roles:create'),
	READ: permission('admin:roles:read'),
	UPDATE: permission('admin:roles:update'),
	DELETE: permission('admin:roles:delete'),
} as const)

export const ADMIN_USER_ROLE_PERMISSIONS = Object.freeze({
	READ: permission('admin:user_roles:read'),
	ASSIGN: permission('admin:user_roles:assign'),
	REMOVE: permission('admin:user_roles:remove'),
} as const)

// ============================================================================
// Seed data
// ============================================================================

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
