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

const connectionString = env.PG_CONNECTION_STRING

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

// Initialize Drizzle with schema for relational query API support
export const drizzlePgConnector = drizzle(connectionString, { schema })

// Type export for DI container
export type DrizzlePgConnector = typeof drizzlePgConnector
