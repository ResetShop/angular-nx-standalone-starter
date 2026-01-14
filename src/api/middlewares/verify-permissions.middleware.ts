import { Next } from 'hono';
import { container } from '../container';
import { AuthenticatedContext } from './verify-access-token.middleware';

/**
 * Branded type for snake_case permission names.
 * Use the `permission()` helper to create validated instances.
 */
export type PermissionName = string & { readonly __brand: 'PermissionName' };

/**
 * Validates and creates a type-safe permission name.
 * @param name - Permission name in snake_case format (e.g., 'can_create_users')
 * @throws Error if format is invalid
 */
export function permission(name: string): PermissionName {
	if (!/^[a-z][a-z0-9_]*$/.test(name)) {
		throw new Error(`Invalid permission name: "${name}". Must be snake_case (e.g., 'can_create_users')`);
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
 * app.post('/users', requirePermission(permission('can_create_users')), async (c) => {
 *   // Only users with 'can_create_users' permission reach here
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
			} catch {
				// User not found or other error - deny access
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
