/**
 * Curated `schema` value used by:
 *   - the production drizzle connector (`drizzle-postgres-connector.ts`)
 *   - the integration test infra (`db-helpers.ts`, `global-setup.ts` / future
 *     `pglite-test-db.ts` per #321)
 *   - drizzle-kit/api's `pushSchema(schema, db)` calls in test setup
 *
 * Centralised so adding or renaming a schema only happens in one place
 * instead of three. Curated value export — not a `*` re-export — so it does
 * not violate the project's no-barrel-files constraint.
 */
import { authentication, authenticationRelations } from './authentication'
import { permission, permissionRelations } from './permission'
import { permissionRoute, permissionRouteRelations, routeTypeEnum } from './permission-route'
import { refreshToken } from './refresh-token'
import { role, rolePermission, rolePermissionRelations, roleRelations } from './role'
import { roleHistory } from './role-history'
import { rolePermissionHistory } from './role-permission-history'
import { user, userRelations, userRole, userRoleRelations, userStatusEnum } from './user'
import { userProfileHistory } from './user-profile-history'
import { userRoleHistory } from './user-role-history'
import { userStatusHistory } from './user-status-history'

// `userStatusEnum` and `routeTypeEnum` are pgEnums; including them in the
// schema object is required for drizzle-kit/api's `pushSchema` to emit the
// `CREATE TYPE` DDL before tables that reference them. Production drizzle()
// query usage doesn't strictly need the enums in the schema object, but
// keeping one shared shape avoids surprises.
export const schema = {
	authentication,
	authenticationRelations,
	permission,
	permissionRelations,
	permissionRoute,
	permissionRouteRelations,
	routeTypeEnum,
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
	userStatusEnum,
	userProfileHistory,
	userRoleHistory,
	userStatusHistory,
}

export type AppSchema = typeof schema
