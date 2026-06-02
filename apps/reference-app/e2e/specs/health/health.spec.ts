import { expect, test } from '../../fixtures'
import { STORAGE_STATE } from '../../fixtures/storage-state'
import { HealthPage } from '../../page-objects/health.page'

// Read-only page backed by the live GET /api/health/v1 (the seeded test DB is up, so it reports healthy).
test.describe('Health', () => {
	test.use({ storageState: STORAGE_STATE.admin })

	let health: HealthPage
	test.beforeEach(async ({ page }) => {
		health = new HealthPage(page)
		await health.goto()
	})

	test('renders the health status and database check from the API', async () => {
		await expect(health.heading).toBeVisible()
		await expect(health.checksHeading).toBeVisible()
		await expect(health.databaseHeading).toBeVisible()
		// The overall status (first badge) and the database check (second) both report 'healthy' against the
		// live backend. Asserting the two positionally is robust if further checks are added later.
		await expect(health.healthyBadge.nth(0)).toBeVisible()
		await expect(health.healthyBadge.nth(1)).toBeVisible()
	})
})
