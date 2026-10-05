import { createDrizzlePgConnector } from '../api/helpers/drizzle-postgres-connector'
import { seedLegacyRoles } from './seed-legacy-roles'

/**
 * Adds the legacy roles to a database that was seeded before they existed (`npm run drizzle:seed:brillante`
 * already includes them for new databases) and makes the ones seeded as non-removable removable. Idempotent, and
 * fails if the Administrator role is missing.
 *
 * Usage: npm run drizzle:seed-roles:brillante
 */
async function seedRoles(): Promise<void> {
	const db = createDrizzlePgConnector()
	try {
		const { created, updated, existing } = await db.transaction((tx) => seedLegacyRoles(tx))
		console.log(`✅ Legacy roles created: ${created.length ? created.join(', ') : 'none'}`)
		console.log(`✅ Legacy roles made removable: ${updated.length ? updated.join(', ') : 'none'}`)
		console.log(`✅ Legacy roles already up to date: ${existing.length ? existing.join(', ') : 'none'}`)
	} finally {
		await db.$client.end()
	}
}

seedRoles()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error('❌ Seeding the legacy roles failed:', error)
		process.exit(1)
	})
