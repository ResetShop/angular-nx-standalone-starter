import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { environment } from '../api/helpers/environment';
import { authentication } from './schema/authentication';
import { user } from './schema/user';

const pool = new Pool({
	connectionString: environment.database.pg.connectionString,
});

const db = drizzle(pool);

async function seed() {
	try {
		console.log('🌱 Starting database seed...');

		// Insert admin user
		const adminUser = await db
			.insert(user)
			.values({
				firstName: 'Administrador',
				lastName: 'Sistema',
				email: 'admin@sistema.com',
				enabled: true,
				deleted: false,
			})
			.onConflictDoNothing()
			.returning({ id: user.id });

		console.log('✅ Admin user created/verified');

		// Get the admin user to insert authentication
		let adminUserRecord = adminUser;

		if (!adminUserRecord.length) {
			// If insert returned nothing, fetch by email
			const fetchedUser = await db.select({ id: user.id }).from(user).where(eq(user.email, 'admin@sistema.com'));

			if (!fetchedUser.length) {
				throw new Error('Failed to create or retrieve admin user');
			}

			adminUserRecord = fetchedUser;
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
		console.log('✅ Database seed completed successfully');
		process.exit(0);
	} catch (error) {
		console.error('❌ Seed failed:', error);
		process.exit(1);
	}
}

seed();
