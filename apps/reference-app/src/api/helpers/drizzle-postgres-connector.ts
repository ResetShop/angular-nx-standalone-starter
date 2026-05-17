import { env } from '@config/env'
import { authentication, authenticationRelations } from '@schema/authentication'
import { permission, permissionRelations } from '@schema/permission'
import { permissionRoute, permissionRouteRelations } from '@schema/permission-route'
import { refreshToken } from '@schema/refresh-token'
import { role, rolePermission, rolePermissionRelations, roleRelations } from '@schema/role'
import { roleHistory } from '@schema/role-history'
import { rolePermissionHistory } from '@schema/role-permission-history'
import { user, userRelations, userRole, userRoleRelations } from '@schema/user'
import { userProfileHistory } from '@schema/user-profile-history'
import { userRoleHistory } from '@schema/user-role-history'
import { userStatusHistory } from '@schema/user-status-history'
import { drizzle } from 'drizzle-orm/node-postgres'

// Schema object for Drizzle's relational query API
const schema = {
	authentication,
	authenticationRelations,
	permission,
	permissionRelations,
	permissionRoute,
	permissionRouteRelations,
	refreshToken,
	role,
	rolePermission,
	roleRelations,
	rolePermissionRelations,
	roleHistory,
	rolePermissionHistory,
	user,
	userRole,
	userRelations,
	userRoleRelations,
	userProfileHistory,
	userRoleHistory,
	userStatusHistory,
}

/**
 * Constructs the Drizzle PG connector. Wrapped in a factory so that the env
 * value `PG_CONNECTION_STRING` is read lazily — the Angular SSR prerender
 * worker imports the server bundle without env vars set, and a top-level
 * `drizzle(env.PG_CONNECTION_STRING, ...)` call here would trigger eager
 * validation and crash the worker.
 *
 * The DI container registers this as `asFunction(...).singleton()` so it's
 * called once on first cradle access in production.
 */
export function createDrizzlePgConnector() {
	return drizzle(env.PG_CONNECTION_STRING, { schema })
}

// Type export for DI container
export type DrizzlePgConnector = ReturnType<typeof createDrizzlePgConnector>
