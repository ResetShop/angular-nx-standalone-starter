import { hash } from 'bcryptjs';
import { eq, inArray, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { authentication } from '../../../db/schema/authentication';
import { permission } from '../../../db/schema/permission';
import { role, rolePermission } from '../../../db/schema/role';
import { user, userRole } from '../../../db/schema/user';
import { ADMIN_PERMISSIONS_SEED_DATA } from '../../modules/access/role/permissions.constants';

// Schema for relational queries
import { authenticationRelations } from '../../../db/schema/authentication';
import { permissionRelations } from '../../../db/schema/permission';
import { permissionRoute, permissionRouteRelations } from '../../../db/schema/permission-route';
import { refreshToken } from '../../../db/schema/refresh-token';
import { rolePermissionRelations, roleRelations } from '../../../db/schema/role';
import { userRelations, userRoleRelations } from '../../../db/schema/user';

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
	user,
	userRole,
	userRelations,
	userRoleRelations,
};

type TestDb = ReturnType<typeof drizzle<typeof schema>>;

let testDb: TestDb | null = null;

function getAdminPassword(): string {
	const password = process.env['INTEGRATION_TEST_ADMIN_PASSWORD'];
	if (!password) {
		throw new Error('INTEGRATION_TEST_ADMIN_PASSWORD environment variable is required.');
	}
	return password;
}

async function getAdminPasswordHash(): Promise<string> {
	return hash(getAdminPassword(), 1);
}

/**
 * Returns a Drizzle instance connected to the test database.
 * Reuses the same instance across calls within a test run.
 */
export function getTestDb(): TestDb {
	if (!testDb) {
		const connectionString = process.env['PG_CONNECTION_STRING'];
		if (!connectionString) {
			throw new Error('PG_CONNECTION_STRING environment variable is required.');
		}
		testDb = drizzle(connectionString, { schema });
	}
	return testDb;
}

/**
 * Closes the test database connection pool.
 * Call this in a global afterAll to allow the process to exit cleanly.
 */
export async function closeTestDb(): Promise<void> {
	if (testDb) {
		await testDb.$client.end();
		testDb = null;
	}
}

/**
 * Truncates all tables in the correct order to respect foreign key constraints.
 * Uses CASCADE to handle remaining FK dependencies.
 */
export async function truncateAllTables(db: TestDb): Promise<void> {
	await db.execute(sql`
		TRUNCATE TABLE
			permission_route,
			role_permission,
			user_role,
			refresh_token,
			authentication,
			permission,
			role,
			"user"
		CASCADE
	`);
}

/**
 * Returns the seeded admin user and role IDs from the test database.
 * Use this in beforeAll() instead of making HTTP list calls to resolve IDs.
 */
export async function getSeededAdminIds(db: TestDb): Promise<{ adminUserId: number; adminRoleId: number }> {
	const [adminUser] = await db.select({ id: user.id }).from(user).where(eq(user.email, 'admin@sistema.com'));
	const [adminRole] = await db.select({ id: role.id }).from(role).where(eq(role.code, 'admin'));

	if (!adminUser || !adminRole) {
		throw new Error('Seeded admin user or role not found. Ensure global setup has run.');
	}

	return { adminUserId: adminUser.id, adminRoleId: adminRole.id };
}

/**
 * Seeds the test database with base data:
 * - Admin user (admin@sistema.com / admin123)
 * - Administrator role (code: admin, removable: false)
 * - All permissions from ADMIN_PERMISSIONS_SEED_DATA
 * - Role-permission assignments
 * - User-role assignment
 */
export async function seedBaseData(db: TestDb): Promise<{ adminUserId: number; adminRoleId: number }> {
	const passwordHash = await getAdminPasswordHash();

	const [adminUser] = await db
		.insert(user)
		.values({
			firstName: 'Administrador',
			lastName: 'Sistema',
			email: 'admin@sistema.com',
		})
		.returning({ id: user.id });

	await db.insert(authentication).values({
		userId: adminUser.id,
		passwordHash,
		failedLoginAttempts: 0,
	});

	const [adminRole] = await db
		.insert(role)
		.values({
			name: 'Administrator',
			code: 'admin',
			description: 'System administrator with full access',
			removable: false,
		})
		.returning({ id: role.id });

	await db.insert(userRole).values({ userId: adminUser.id, roleId: adminRole.id });

	await db.insert(permission).values([...ADMIN_PERMISSIONS_SEED_DATA]);

	const permissionNames = ADMIN_PERMISSIONS_SEED_DATA.map((p) => p.name);
	const createdPermissions = await db
		.select({ id: permission.id })
		.from(permission)
		.where(inArray(permission.name, permissionNames));

	const rolePermissionValues = createdPermissions.map((p) => ({
		roleId: adminRole.id,
		permissionId: p.id,
	}));
	await db.insert(rolePermission).values(rolePermissionValues);

	return { adminUserId: adminUser.id, adminRoleId: adminRole.id };
}

/**
 * Creates a user with no permissions for testing 403 responses.
 * Each call generates a unique email/code to avoid constraint violations.
 */
export async function seedRestrictedUser(db: TestDb): Promise<{ userId: number; email: string; password: string }> {
	const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
	const email = `restricted_${suffix}@test.com`;

	const passwordHash = await getAdminPasswordHash();

	const [restrictedUser] = await db
		.insert(user)
		.values({
			firstName: 'Restricted',
			lastName: 'User',
			email,
		})
		.returning({ id: user.id });

	await db.insert(authentication).values({
		userId: restrictedUser.id,
		passwordHash,
		failedLoginAttempts: 0,
	});

	const [restrictedRole] = await db
		.insert(role)
		.values({
			name: `Restricted ${suffix}`,
			code: `restricted_${suffix}`,
			description: 'Role with no permissions',
			removable: true,
		})
		.returning({ id: role.id });

	await db.insert(userRole).values({ userId: restrictedUser.id, roleId: restrictedRole.id });

	return { userId: restrictedUser.id, email, password: getAdminPassword() };
}
