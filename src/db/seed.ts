import { eq, inArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { environment } from '../api/helpers/environment'
import { PERMISSIONS_SEED_DATA } from '../contracts/permission/permission.constants'
import { authentication } from './schema/authentication'
import { permission } from './schema/permission'
import { role, rolePermission } from './schema/role'
import { user, userRole } from './schema/user'

const pool = new Pool({
	connectionString: environment.database.pg.connectionString,
})

const db = drizzle(pool)

/**
 * Seeds the database with initial data in a transaction.
 * Creates admin user, Administrator role, permissions, and role assignments.
 *
 * This is a full bootstrap script for fresh databases.
 * For adding new permissions to an existing database, use `npm run sync:permissions` instead.
 * See `src/db/sync-permissions.ts`.
 */
async function seed() {
	try {
		console.log('🌱 Starting database seed...')

		await db.transaction(async (tx) => {
			// Step 1: Create or get admin user
			const existingUser = await tx.select({ id: user.id }).from(user).where(eq(user.email, 'admin@sistema.com'))

			let adminUserId: number

			if (existingUser.length > 0) {
				adminUserId = existingUser[0].id
				console.log('✅ Admin user already exists')
			} else {
				const insertResult = await tx
					.insert(user)
					.values({
						firstName: 'Administrador',
						lastName: 'Sistema',
						email: 'admin@sistema.com',
					})
					.returning({ id: user.id })

				if (!insertResult.length) {
					throw new Error('Failed to create admin user')
				}

				adminUserId = insertResult[0].id
				console.log('✅ Admin user created')
			}

			// Step 2: Create authentication record
			await tx
				.insert(authentication)
				.values({
					userId: adminUserId,
					passwordHash: '$2b$10$NtbOLIxB.WraBf4TdAGJDeIiUxJwaYqNq8gFWtUGmWtoZnQNMPTnG',
					failedLoginAttempts: 0,
				})
				.onConflictDoNothing()
			console.log('✅ Authentication record created/verified')

			// Step 3: Create or get Administrator role
			const existingRole = await tx.select({ id: role.id }).from(role).where(eq(role.code, 'admin'))

			let adminRoleId: number

			if (existingRole.length > 0) {
				adminRoleId = existingRole[0].id
				console.log('✅ Administrator role already exists')
			} else {
				const adminRoleResult = await tx
					.insert(role)
					.values({
						name: 'Administrator',
						code: 'admin',
						description: 'System administrator with full access',
						removable: false,
					})
					.returning({ id: role.id })

				if (!adminRoleResult.length) {
					throw new Error('Failed to create Administrator role')
				}

				adminRoleId = adminRoleResult[0].id
				console.log('✅ Administrator role created')
			}

			// Step 4: Assign Administrator role to admin user
			await tx.insert(userRole).values({ userId: adminUserId, roleId: adminRoleId }).onConflictDoNothing()
			console.log('✅ Administrator role assigned to admin user')

			// Step 5: Create permissions (batch insert)
			await tx
				.insert(permission)
				.values([...PERMISSIONS_SEED_DATA])
				.onConflictDoNothing()

			// Get all permission IDs by name
			const permissionNames = PERMISSIONS_SEED_DATA.map((p) => p.name)
			const createdPermissions = await tx
				.select({ id: permission.id })
				.from(permission)
				.where(inArray(permission.name, permissionNames))

			if (createdPermissions.length !== PERMISSIONS_SEED_DATA.length) {
				throw new Error(
					`Permission count mismatch: expected ${PERMISSIONS_SEED_DATA.length}, got ${createdPermissions.length}`,
				)
			}
			console.log(`✅ ${PERMISSIONS_SEED_DATA.length} permissions created/verified`)

			// Step 6: Assign all permissions to Administrator role (batch insert)
			const rolePermissionValues = createdPermissions.map((p) => ({
				roleId: adminRoleId,
				permissionId: p.id,
			}))
			await tx.insert(rolePermission).values(rolePermissionValues).onConflictDoNothing()
			console.log('✅ Permissions assigned to Administrator role')
		})

		console.log('✅ Database seed completed successfully')
		process.exit(0)
	} catch (error) {
		console.error('❌ Seed failed:', error)
		process.exit(1)
	}
}

void seed()
