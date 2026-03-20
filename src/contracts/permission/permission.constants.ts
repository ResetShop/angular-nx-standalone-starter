/**
 * Permission definitions using the 3-part format (module:resource:action).
 *
 * Single source of truth for both backend middleware (requirePermission)
 * and frontend authorization (route guards, sidebar filtering, button visibility).
 *
 * To add a new permission:
 * 1. Add an entry to PERMISSION_DEFINITIONS with key, identifier, and description
 * 2. Run the seed script — everything else is derived automatically
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
// Permission definitions — the single array you edit to add new permissions
// ============================================================================

const PERMISSION_DEFINITIONS = [
	// Permission management
	{ key: 'PERMISSIONS_READ', identifier: 'admin:permissions:read', description: 'View all system permissions' },
	// User management
	{ key: 'USERS_CREATE', identifier: 'admin:users:create', description: 'Create new users' },
	{ key: 'USERS_READ', identifier: 'admin:users:read', description: 'View user details' },
	{ key: 'USERS_UPDATE', identifier: 'admin:users:update', description: 'Update user information' },
	{ key: 'USERS_DELETE', identifier: 'admin:users:delete', description: 'Delete users' },
	{ key: 'USERS_RESET_PASSWORD', identifier: 'admin:users:reset_password', description: 'Reset user passwords' },
	{ key: 'USERS_DISABLE', identifier: 'admin:users:disable', description: 'Manage user account status' },
	// Role management
	{ key: 'ROLES_CREATE', identifier: 'admin:roles:create', description: 'Create new roles' },
	{ key: 'ROLES_READ', identifier: 'admin:roles:read', description: 'View role details' },
	{ key: 'ROLES_UPDATE', identifier: 'admin:roles:update', description: 'Update roles' },
	{ key: 'ROLES_DELETE', identifier: 'admin:roles:delete', description: 'Delete roles' },
	// User-role assignment management
	{ key: 'USER_ROLES_READ', identifier: 'admin:user_roles:read', description: 'View user role assignments' },
	{ key: 'USER_ROLES_ASSIGN', identifier: 'admin:user_roles:assign', description: 'Assign roles to users' },
	{ key: 'USER_ROLES_REMOVE', identifier: 'admin:user_roles:remove', description: 'Remove roles from users' },
] as const

// ============================================================================
// Derived lookup object
// ============================================================================

type PermissionKey = (typeof PERMISSION_DEFINITIONS)[number]['key']
type PermissionMap = { readonly [K in PermissionKey]: PermissionName }

/**
 * Flat lookup object for all permission identifiers.
 *
 * @example
 * ```typescript
 * Permission.USERS_READ     // 'admin:users:read'
 * Permission.ROLES_CREATE   // 'admin:roles:create'
 * ```
 */
export const Permission: PermissionMap = Object.freeze(
	Object.fromEntries(PERMISSION_DEFINITIONS.map((p) => [p.key, permission(p.identifier)])) as PermissionMap,
)

// ============================================================================
// Seed data
// ============================================================================

function parseIdentifier(identifier: string): { module: string; resource: string; action: string } {
	const [module, resource, action] = identifier.split(':')
	return { module, resource, action }
}

/**
 * All permission definitions for DB seeding.
 * Derived from PERMISSION_DEFINITIONS — module, resource, and action
 * are parsed from the identifier.
 */
export const PERMISSIONS_SEED_DATA = PERMISSION_DEFINITIONS.map((p) => ({
	name: p.identifier,
	description: p.description,
	...parseIdentifier(p.identifier),
}))
