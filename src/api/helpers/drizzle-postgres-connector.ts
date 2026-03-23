import { drizzle } from 'drizzle-orm/node-postgres'
import { authentication, authenticationRelations } from '../../db/schema/authentication'
import { permission, permissionRelations } from '../../db/schema/permission'
import { permissionRoute, permissionRouteRelations } from '../../db/schema/permission-route'
import { refreshToken } from '../../db/schema/refresh-token'
import { role, rolePermission, rolePermissionRelations, roleRelations } from '../../db/schema/role'
import { roleHistory } from '../../db/schema/role-history'
import { rolePermissionHistory } from '../../db/schema/role-permission-history'
import { user, userRelations, userRole, userRoleRelations } from '../../db/schema/user'
import { userRoleHistory } from '../../db/schema/user-role-history'
import { userStatusHistory } from '../../db/schema/user-status-history'
import { environment } from './environment'

const { connectionString } = environment.database.pg

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
	userRoleHistory,
	userStatusHistory,
}

// Initialize Drizzle with schema for relational query API support
export const drizzlePgConnector = drizzle(connectionString, { schema })

// Type export for DI container
export type DrizzlePgConnector = typeof drizzlePgConnector
