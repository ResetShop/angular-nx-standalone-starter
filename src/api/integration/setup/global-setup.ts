/**
 * Vitest globalSetup — runs once before all test files in a separate process.
 * Pushes the DB schema to the test database and seeds base data.
 * On teardown, truncates all tables.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(): void {
	try {
		const envPath = resolve(process.cwd(), '.env');
		const envContent = readFileSync(envPath, 'utf-8');
		for (const line of envContent.split('\n')) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eqIndex = trimmed.indexOf('=');
			if (eqIndex === -1) continue;
			const key = trimmed.slice(0, eqIndex).trim();
			const value = trimmed.slice(eqIndex + 1).trim();
			if (!process.env[key]) {
				process.env[key] = value;
			}
		}
	} catch {
		// .env not found — rely on existing env vars
	}
}

export async function setup(): Promise<void> {
	loadEnvFile();

	const testConnectionString = process.env['PG_TEST_CONNECTION_STRING'];
	if (!testConnectionString) {
		throw new Error(
			'PG_TEST_CONNECTION_STRING environment variable is required for integration tests. ' +
				'Set it in .env or export it before running tests.',
		);
	}

	// Override PG_CONNECTION_STRING so drizzle-kit and the app use the test DB
	process.env['PG_CONNECTION_STRING'] = testConnectionString;

	// Set required env vars for container initialization
	if (!process.env['PASETO_SECRET_KEY']) {
		process.env['PASETO_SECRET_KEY'] = 'a'.repeat(64);
	}
	if (!process.env['PASETO_ISSUER']) {
		process.env['PASETO_ISSUER'] = 'integration-test';
	}
	process.env['COOKIE_SECURE'] = 'false';
	process.env['EMAIL_PROVIDER'] = 'ethereal';

	// Step 1: Push schema to the test database using drizzle-kit's programmatic API
	console.log('[Integration] Pushing schema to test database...');
	const { pushSchema } = await import('drizzle-kit/api');
	const { drizzle } = await import('drizzle-orm/node-postgres');

	// Import all schema objects
	const schemaImports = await import('../../../db/schema/user');
	const roleSchema = await import('../../../db/schema/role');
	const permSchema = await import('../../../db/schema/permission');
	const authSchema = await import('../../../db/schema/authentication');
	const refreshSchema = await import('../../../db/schema/refresh-token');
	const permRouteSchema = await import('../../../db/schema/permission-route');

	const allSchemaImports: Record<string, unknown> = {
		...schemaImports,
		...roleSchema,
		...permSchema,
		...authSchema,
		...refreshSchema,
		...permRouteSchema,
	};

	const db = drizzle(testConnectionString);

	const pushResult = await pushSchema(allSchemaImports, db);

	if (pushResult.warnings.length > 0) {
		console.log('[Integration] Schema push warnings:', pushResult.warnings);
	}

	await pushResult.apply();
	console.log('[Integration] Schema pushed successfully.');

	// Step 2: Seed base data
	console.log('[Integration] Seeding base data...');
	const { sql, eq, inArray } = await import('drizzle-orm');
	const { user, userRole } = schemaImports;
	const { authentication } = authSchema;
	const { role, rolePermission } = roleSchema;
	const { permission } = permSchema;

	const { ADMIN_PERMISSIONS_SEED_DATA } = await import('../../modules/access/role/permissions.constants');

	const adminPassword = process.env['INTEGRATION_TEST_ADMIN_PASSWORD'];
	if (!adminPassword) {
		throw new Error(
			'INTEGRATION_TEST_ADMIN_PASSWORD environment variable is required for integration tests. ' +
				'Set it in .env or export it before running tests.',
		);
	}
	const bcrypt = await import('bcryptjs');
	const ADMIN_PASSWORD_HASH = await bcrypt.hash(adminPassword, 10);

	// Truncate in case there's leftover data
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

	// Create admin user
	const [adminUser] = await db
		.insert(user)
		.values({
			firstName: 'Administrador',
			lastName: 'Sistema',
			email: 'admin@sistema.com',
		})
		.returning({ id: user.id });

	// Create authentication record
	await db.insert(authentication).values({
		userId: adminUser.id,
		passwordHash: ADMIN_PASSWORD_HASH,
		failedLoginAttempts: 0,
	});

	// Create Administrator role
	const [adminRole] = await db
		.insert(role)
		.values({
			name: 'Administrator',
			code: 'admin',
			description: 'System administrator with full access',
			removable: false,
		})
		.returning({ id: role.id });

	// Assign role to admin user
	await db.insert(userRole).values({ userId: adminUser.id, roleId: adminRole.id });

	// Create all permissions
	await db.insert(permission).values([...ADMIN_PERMISSIONS_SEED_DATA]);

	// Get all permission IDs and assign to Administrator role
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

	await db.$client.end();
	console.log('[Integration] Base data seeded successfully.');
}

export async function teardown(): Promise<void> {
	const testConnectionString = process.env['PG_TEST_CONNECTION_STRING'];
	if (!testConnectionString) return;

	console.log('[Integration] Cleaning up test database...');
	const { drizzle } = await import('drizzle-orm/node-postgres');
	const { sql } = await import('drizzle-orm');

	const db = drizzle(testConnectionString);

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

	await db.$client.end();
	console.log('[Integration] Test database cleaned up.');
}
