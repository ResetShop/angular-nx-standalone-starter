import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { environment } from '../api/helpers/environment';
import { ADMIN_PERMISSIONS_SEED_DATA } from '../api/modules/role/permissions.constants';
import { authentication } from './schema/authentication';
import { permission } from './schema/permission';
import { role, rolePermission } from './schema/role';
import { user, userRole } from './schema/user';

const pool = new Pool({
	connectionString: environment.database.pg.connectionString,
});

const db = drizzle(pool);

/**
 * Seeds the database with initial data in a transaction.
 * Creates admin user, Administrator role, permissions, and role assignments.
 */
async function seed() {
	try {
		console.log('🌱 Starting database seed...');

		await db.transaction(async (tx) => {
			// Step 1: Create or get admin user
			const existingUser = await tx.select({ id: user.id }).from(user).where(eq(user.email, 'admin@sistema.com'));

			let adminUserId: number;

			if (existingUser.length > 0) {
				adminUserId = existingUser[0].id;
				console.log('✅ Admin user already exists');
			} else {
				const insertResult = await tx
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

				adminUserId = insertResult[0].id;
				console.log('✅ Admin user created');
			}

			// Step 2: Create authentication record
			await tx
				.insert(authentication)
				.values({
					userId: adminUserId,
					passwordHash: '$2b$10$NtbOLIxB.WraBf4TdAGJDeIiUxJwaYqNq8gFWtUGmWtoZnQNMPTnG',
					failedLoginAttempts: 0,
				})
				.onConflictDoNothing();
			console.log('✅ Authentication record created/verified');

			// Step 3: Create or get Administrator role
			const existingRole = await tx.select({ id: role.id }).from(role).where(eq(role.code, 'admin'));

			let adminRoleId: number;

			if (existingRole.length > 0) {
				adminRoleId = existingRole[0].id;
				console.log('✅ Administrator role already exists');
			} else {
				const adminRoleResult = await tx
					.insert(role)
					.values({
						name: 'Administrator',
						code: 'admin',
						description: 'System administrator with full access',
						removable: false,
					})
					.returning({ id: role.id });

				if (!adminRoleResult.length) {
					throw new Error('Failed to create Administrator role');
				}

				adminRoleId = adminRoleResult[0].id;
				console.log('✅ Administrator role created');
			}

			// Step 4: Assign Administrator role to admin user
			await tx.insert(userRole).values({ userId: adminUserId, roleId: adminRoleId }).onConflictDoNothing();
			console.log('✅ Administrator role assigned to admin user');

			// Step 5: Create permissions
			const permissionIds: number[] = [];
			for (const perm of ADMIN_PERMISSIONS_SEED_DATA) {
				const existingPerm = await tx
					.select({ id: permission.id })
					.from(permission)
					.where(eq(permission.name, perm.name));

				if (existingPerm.length > 0) {
					permissionIds.push(existingPerm[0].id);
				} else {
					const result = await tx.insert(permission).values(perm).returning({ id: permission.id });
					if (result.length > 0) {
						permissionIds.push(result[0].id);
					}
				}
			}
			console.log(`✅ ${ADMIN_PERMISSIONS_SEED_DATA.length} permissions created/verified`);

			// Step 6: Assign all permissions to Administrator role
			for (const permId of permissionIds) {
				await tx.insert(rolePermission).values({ roleId: adminRoleId, permissionId: permId }).onConflictDoNothing();
			}
			console.log('✅ Permissions assigned to Administrator role');
		});

		console.log('✅ Database seed completed successfully');
		process.exit(0);
	} catch (error) {
		console.error('❌ Seed failed:', error);
		process.exit(1);
	}
}

void seed();
