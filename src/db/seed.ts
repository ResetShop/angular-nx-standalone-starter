import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { environment } from '../api/helpers/environment';
import { authentication } from './schema/authentication';
import { role } from './schema/role';
import { user, userRole } from './schema/user';

const pool = new Pool({
	connectionString: environment.database.pg.connectionString,
});

const db = drizzle(pool);

/**
 * Seeds the database with the admin user and its corresponding authentication record.
 * Returns the ID of the admin user.
 */
async function createAdminUser(): Promise<number> {
	// Check if admin user already exists
	const existingUser = await db.select({ id: user.id }).from(user).where(eq(user.email, 'admin@sistema.com'));

	let adminUserRecord;

	if (existingUser.length > 0) {
		adminUserRecord = existingUser;
		console.log('✅ Admin user already exists');
	} else {
		// Insert admin user if it doesn't exist
		const insertResult = await db
			.insert(user)
			.values({
				firstName: 'Administrador',
				lastName: 'Sistema',
				email: 'admin@sistema.com',
				enabled: true,
				deleted: false,
			})
			.returning({ id: user.id });

		if (!insertResult.length) {
			throw new Error('Failed to create admin user');
		}

		adminUserRecord = insertResult;
		console.log('✅ Admin user created');
	}

	// Insert authentication record
	await db
		.insert(authentication)
		.values({
			userId: adminUserRecord[0].id,
			passwordHash: '$2b$10$NtbOLIxB.WraBf4TdAGJDeIiUxJwaYqNq8gFWtUGmWtoZnQNMPTnG',
			failedLoginAttempts: 0,
		})
		.onConflictDoNothing();

	console.log('✅ Authentication record created/verified');
	return adminUserRecord[0].id;
}

async function assignAdminUserRoles(adminUserId: number) {
	// Insert record for
	const adminRole = await db
		.insert(role)
		.values({
			name: 'Administrator',
			description: 'Administrator role',
		})
		.onConflictDoNothing()
		.returning();

	// Assign the admin role to the admin user
	await db.insert(userRole).values({ userId: adminUserId, roleId: adminRole[0].id }).onConflictDoNothing();
}

async function seed() {
	try {
		console.log('🌱 Starting database seed...');
		const adminUserId = await createAdminUser();
		await assignAdminUserRoles(adminUserId);
		console.log('✅ Database seed completed successfully');
		process.exit(0);
	} catch (error) {
		console.error('❌ Seed failed:', error);
		process.exit(1);
	}
}

seed();
