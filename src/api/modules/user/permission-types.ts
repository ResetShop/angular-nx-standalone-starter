/**
 * Branded type for permission names in module:resource:action format.
 * Use the `permission()` helper to create validated instances.
 *
 * Format: module:resource:action
 * - module: Domain/area (admin, billing, reports)
 * - resource: Entity (users, roles, invoices)
 * - action: Operation (create, read, update, delete)
 *
 * Examples: 'admin:users:create', 'billing:invoices:read'
 */
export type PermissionName = string & { readonly __brand: 'PermissionName' };

/**
 * Regex pattern for module:resource:action permission format.
 * Each segment must be snake_case starting with a letter.
 */
const PERMISSION_PATTERN = /^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$/;

/**
 * Validates and creates a type-safe permission name.
 * @param name - Permission in module:resource:action format (e.g., 'admin:users:create')
 * @throws Error if format is invalid
 */
export function permission(name: string): PermissionName {
	if (!PERMISSION_PATTERN.test(name)) {
		throw new Error(
			`Invalid permission name: "${name}". Must be in module:resource:action format (e.g., 'admin:users:create')`,
		);
	}
	return name as PermissionName;
}
