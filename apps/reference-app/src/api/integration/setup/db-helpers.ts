import { PERMISSIONS_SEED_DATA } from '@contracts/permission/permission.constants'
import { authentication } from '@schema/authentication'
import { permission } from '@schema/permission'
import { role, rolePermission } from '@schema/role'
import { user, userRole } from '@schema/user'
import { hash } from 'bcryptjs'
import { eq, inArray, sql } from 'drizzle-orm'
import { drizzlePgConnector, type DrizzlePgConnector } from '../../helpers/drizzle-postgres-connector'

type TestDb = DrizzlePgConnector

function getAdminPassword(): string {
	const password = process.env['INTEGRATION_TEST_ADMIN_PASSWORD']
	if (!password) {
		throw new Error('INTEGRATION_TEST_ADMIN_PASSWORD environment variable is required.')
	}
	return password
}

async function getAdminPasswordHash(): Promise<string> {
	return hash(getAdminPassword(), 1)
}

/**
 * Returns the same drizzle handle the production code uses (shared via the
 * Awilix container's `db` registration). In #321 this collapsed from a
 * separate parallel pg-pool to the unified connector — required for the
 * PGlite path (in-process WASM Postgres has only one instance per process)
 * and a non-issue for the node-postgres path (route handlers and test infra
 * sharing one pool is fine for an integration suite).
 */
export function getTestDb(): TestDb {
	return drizzlePgConnector
}

/**
 * Truncates all tables in the correct order to respect foreign key constraints.
 * Uses CASCADE to handle remaining FK dependencies.
 */
export async function truncateAllTables(db: TestDb): Promise<void> {
	await db.execute(sql`
		TRUNCATE TABLE
			role_history,
			role_permission_history,
			user_profile_history,
			user_role_history,
			user_status_history,
			permission_route,
			role_permission,
			user_role,
			refresh_token,
			authentication,
			permission,
			role,
			"user"
		CASCADE
	`)
}

/**
 * Returns the seeded admin user and role IDs from the test database.
 * Use this in beforeAll() instead of making HTTP list calls to resolve IDs.
 */
export async function getSeededAdminIds(db: TestDb): Promise<{ adminUserId: number; adminRoleId: number }> {
	const [adminUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, 'admin@sistema.com'))
	const [adminRole] = await db.select({ id: role.id }).from(role).where(eq(role.code, 'admin'))

	if (!adminUser || !adminRole) {
		throw new Error('Seeded admin user or role not found. Ensure global setup has run.')
	}

	return { adminUserId: adminUser.id, adminRoleId: adminRole.id }
}

/**
 * Returns the seeded restricted user credentials for 403 tests.
 * This user is created once in global setup — no per-test seeding needed.
 */
export function getRestrictedUserCredentials(): { email: string; password: string } {
	return { email: 'restricted@test.com', password: getAdminPassword() }
}

/**
 * Seeds the test database with base data:
 * - Admin user (admin@sistema.com) with all permissions
 * - Restricted user (restricted@test.com) with no permissions
 * - Administrator role, all permissions, and role-permission assignments
 */
export async function seedBaseData(db: TestDb): Promise<{ adminUserId: number; adminRoleId: number }> {
	const passwordHash = await getAdminPasswordHash()

	const [adminUser] = await db
		.insert(user)
		.values({
			firstName: 'Administrador',
			lastName: 'Sistema',
			email: 'admin@sistema.com',
		})
		.returning({ id: user.id })

	await db.insert(authentication).values({
		userId: adminUser.id,
		passwordHash,
		failedLoginAttempts: 0,
	})

	const [adminRole] = await db
		.insert(role)
		.values({
			name: 'Administrator',
			code: 'admin',
			description: 'System administrator with full access',
			removable: false,
		})
		.returning({ id: role.id })

	await db.insert(userRole).values({ userId: adminUser.id, roleId: adminRole.id })

	await db.insert(permission).values([...PERMISSIONS_SEED_DATA])

	const permissionNames = PERMISSIONS_SEED_DATA.map((p) => p.name)
	const createdPermissions = await db
		.select({ id: permission.id })
		.from(permission)
		.where(inArray(permission.name, permissionNames))

	const rolePermissionValues = createdPermissions.map((p) => ({
		roleId: adminRole.id,
		permissionId: p.id,
	}))
	await db.insert(rolePermission).values(rolePermissionValues)

	await seedRestrictedBaseUser(db, passwordHash)

	return { adminUserId: adminUser.id, adminRoleId: adminRole.id }
}

/**
 * Resets only the lockout state of the admin user's authentication record.
 * Use this instead of truncateAllTables + seedBaseData when only the lockout
 * fields need resetting (e.g., after account lockout tests).
 */
export async function resetAdminLockout(db: TestDb): Promise<void> {
	const [adminUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, 'admin@sistema.com'))
	if (!adminUser) return

	await db
		.update(authentication)
		.set({ failedLoginAttempts: 0, lockedUntil: null })
		.where(eq(authentication.userId, adminUser.id))
}

async function seedRestrictedBaseUser(db: TestDb, passwordHash: string): Promise<void> {
	const [restrictedUser] = await db
		.insert(user)
		.values({ firstName: 'Restricted', lastName: 'User', email: 'restricted@test.com' })
		.returning({ id: user.id })

	await db.insert(authentication).values({ userId: restrictedUser.id, passwordHash, failedLoginAttempts: 0 })

	const [restrictedRole] = await db
		.insert(role)
		.values({ name: 'Restricted', code: 'restricted', description: 'Role with no permissions', removable: true })
		.returning({ id: role.id })

	await db.insert(userRole).values({ userId: restrictedUser.id, roleId: restrictedRole.id })
}
