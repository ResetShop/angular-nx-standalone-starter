import { Next } from 'hono';
import { container } from '../container';
import { AuthenticatedContext } from './verify-access-token.middleware';

/**
 * Permission verification middleware for RBAC.
 *
 * ## Caching Strategy
 * Permissions are cached at the request level (stored in `c.permissions`).
 * This means:
 * - First permission check in a request fetches from database
 * - Subsequent checks in the same request use cached permissions
 * - No cross-request caching (each request fetches fresh permissions)
 *
 * This approach is acceptable for most use cases because:
 * - Multiple permission checks per request don't cause extra DB queries
 * - Permission changes take effect on the next request
 * - No stale cache invalidation complexity
 *
 * ## Future Optimization
 * If profiling shows permission fetching is a bottleneck for high-traffic
 * endpoints, consider:
 * - Redis caching with short TTL (e.g., 60 seconds)
 * - Including permissions in JWT claims (requires token refresh on changes)
 * - Background refresh pattern with stale-while-revalidate
 *
 * @module verify-permissions.middleware
 */

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

/**
 * Middleware factory that creates a permission check middleware.
 * Verifies the authenticated user has the specified permission.
 *
 * @param permissionName - The permission name to check (e.g., 'can_create_users')
 * @returns Hono middleware that checks for the permission
 *
 * @example
 * ```typescript
 * app.post('/users', requirePermission(permission('admin:users:create')), async (c) => {
 *   // Only users with 'admin:users:create' permission reach here
 * });
 * ```
 */
export function requirePermission(permissionName: PermissionName) {
	return async (c: AuthenticatedContext, next: Next) => {
		const user = c.user;

		// User must be authenticated (verifyAccessToken should run first)
		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		// Fetch and cache permissions if not already loaded
		if (!c.permissions) {
			const { userRoleService } = container.cradle;
			try {
				const permissions = await userRoleService.getUserPermissions(Number(user.sub));
				c.permissions = permissions.map((p) => p.name);
			} catch (error) {
				console.error('[Auth] Failed to fetch user permissions:', error);
				return c.json({ error: 'Forbidden' }, 403);
			}
		}

		// Check if user has the required permission
		if (!c.permissions.includes(permissionName)) {
			return c.json({ error: 'Forbidden' }, 403);
		}

		await next();
	};
}

/**
 * Middleware factory that checks if user has ANY of the specified permissions.
 *
 * @param permissionNames - Array of permission names (user needs at least one)
 * @returns Hono middleware
 */
export function requireAnyPermission(permissionNames: PermissionName[]) {
	return async (c: AuthenticatedContext, next: Next) => {
		const user = c.user;

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		if (!c.permissions) {
			const { userRoleService } = container.cradle;
			try {
				const permissions = await userRoleService.getUserPermissions(Number(user.sub));
				c.permissions = permissions.map((p) => p.name);
			} catch {
				return c.json({ error: 'Forbidden' }, 403);
			}
		}

		const userPermissions = c.permissions;
		const hasAnyPermission = permissionNames.some((perm) => userPermissions.includes(perm));
		if (!hasAnyPermission) {
			return c.json({ error: 'Forbidden' }, 403);
		}

		await next();
	};
}

/**
 * Middleware factory that checks if user has ALL of the specified permissions.
 *
 * @param permissionNames - Array of permission names (user needs all of them)
 * @returns Hono middleware
 */
export function requireAllPermissions(permissionNames: PermissionName[]) {
	return async (c: AuthenticatedContext, next: Next) => {
		const user = c.user;

		if (!user) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		if (!c.permissions) {
			const { userRoleService } = container.cradle;
			try {
				const permissions = await userRoleService.getUserPermissions(Number(user.sub));
				c.permissions = permissions.map((p) => p.name);
			} catch {
				return c.json({ error: 'Forbidden' }, 403);
			}
		}

		const userPermissions = c.permissions;
		const hasAllPermissions = permissionNames.every((perm) => userPermissions.includes(perm));
		if (!hasAllPermissions) {
			return c.json({ error: 'Forbidden' }, 403);
		}

		await next();
	};
}
