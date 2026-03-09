/**
 * Vitest globalSetup — runs once before all test files in a separate process.
 * Pushes the DB schema to the test database and seeds base data.
 * On teardown, truncates all tables.
 */
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { loadEnvFile } from './load-env';

function getTestConnectionString(): string {
	const testConnectionString = process.env['PG_TEST_CONNECTION_STRING'];
	if (!testConnectionString) {
		throw new Error(
			'PG_TEST_CONNECTION_STRING environment variable is required for integration tests. ' +
				'Set it in .env or export it before running tests.',
		);
	}
	return testConnectionString;
}

function configureEnvVars(testConnectionString: string): void {
	process.env['PG_CONNECTION_STRING'] = testConnectionString;

	if (!process.env['PASETO_SECRET_KEY']) {
		process.env['PASETO_SECRET_KEY'] = 'a'.repeat(64);
	}
	if (!process.env['PASETO_ISSUER']) {
		process.env['PASETO_ISSUER'] = 'integration-test';
	}
	process.env['COOKIE_SECURE'] = 'false';
	process.env['EMAIL_PROVIDER'] = 'noop';
}

async function pushSchemaToTestDb(connectionString: string): Promise<void> {
	console.log('[Integration] Pushing schema to test database...');
	const { pushSchema } = await import('drizzle-kit/api');
	const { drizzle } = await import('drizzle-orm/node-postgres');

	const allSchemaImports: Record<string, unknown> = {
		...(await import('../../../db/schema/user')),
		...(await import('../../../db/schema/role')),
		...(await import('../../../db/schema/permission')),
		...(await import('../../../db/schema/authentication')),
		...(await import('../../../db/schema/refresh-token')),
		...(await import('../../../db/schema/permission-route')),
	};

	const db = drizzle(connectionString);
	const pushResult = await pushSchema(allSchemaImports, db);

	if (pushResult.warnings.length > 0) {
		console.log('[Integration] Schema push warnings:', pushResult.warnings);
	}

	await pushResult.apply();
	await db.$client.end();
	console.log('[Integration] Schema pushed successfully.');
}

async function seedAdminUser(connectionString: string): Promise<void> {
	console.log('[Integration] Seeding base data...');
	const { drizzle } = await import('drizzle-orm/node-postgres');
	const { inArray } = await import('drizzle-orm');

	const { user, userRole } = await import('../../../db/schema/user');
	const { authentication } = await import('../../../db/schema/authentication');
	const { role, rolePermission } = await import('../../../db/schema/role');
	const { permission } = await import('../../../db/schema/permission');
	const { ADMIN_PERMISSIONS_SEED_DATA } = await import('../../modules/access/role/permissions.constants');

	const adminPassword = process.env['INTEGRATION_TEST_ADMIN_PASSWORD'];
	if (!adminPassword) {
		throw new Error(
			'INTEGRATION_TEST_ADMIN_PASSWORD environment variable is required for integration tests. ' +
				'Set it in .env or export it before running tests.',
		);
	}

	const bcrypt = await import('bcryptjs');
	const passwordHash = await bcrypt.hash(adminPassword, 1);
	const db = drizzle(connectionString);

	await truncateTestTables(db);
	await insertAdminData(db, {
		user,
		authentication,
		role,
		userRole,
		permission,
		rolePermission,
		inArray,
		passwordHash,
		ADMIN_PERMISSIONS_SEED_DATA,
	});

	await db.$client.end();
	console.log('[Integration] Base data seeded successfully.');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic schema imports
async function insertAdminData(db: NodePgDatabase, deps: Record<string, any>): Promise<void> {
	const {
		user,
		authentication,
		role,
		userRole,
		permission,
		rolePermission,
		inArray,
		passwordHash,
		ADMIN_PERMISSIONS_SEED_DATA,
	} = deps;

	const [adminUser] = await db
		.insert(user)
		.values({ firstName: 'Administrador', lastName: 'Sistema', email: 'admin@sistema.com' })
		.returning({ id: user.id });

	await db.insert(authentication).values({ userId: adminUser.id, passwordHash, failedLoginAttempts: 0 });

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

	const permissionNames = ADMIN_PERMISSIONS_SEED_DATA.map((p: { name: string }) => p.name);
	const createdPermissions = await db
		.select({ id: permission.id })
		.from(permission)
		.where(inArray(permission.name, permissionNames));
	const rolePermissionValues = createdPermissions.map((p: { id: number }) => ({
		roleId: adminRole.id,
		permissionId: p.id,
	}));
	await db.insert(rolePermission).values(rolePermissionValues);
}

async function truncateTestTables(db: NodePgDatabase): Promise<void> {
	const { sql } = await import('drizzle-orm');
	await db.execute(sql`
		TRUNCATE TABLE
			permission_route, role_permission, user_role, refresh_token,
			authentication, permission, role, "user"
		CASCADE
	`);
}

export async function setup(): Promise<void> {
	loadEnvFile();
	const connectionString = getTestConnectionString();
	configureEnvVars(connectionString);
	await pushSchemaToTestDb(connectionString);
	await seedAdminUser(connectionString);
}

export async function teardown(): Promise<void> {
	const testConnectionString = process.env['PG_TEST_CONNECTION_STRING'];
	if (!testConnectionString) return;

	console.log('[Integration] Cleaning up test database...');
	const { drizzle } = await import('drizzle-orm/node-postgres');
	const db = drizzle(testConnectionString);
	await truncateTestTables(db);
	await db.$client.end();
	console.log('[Integration] Test database cleaned up.');
}
