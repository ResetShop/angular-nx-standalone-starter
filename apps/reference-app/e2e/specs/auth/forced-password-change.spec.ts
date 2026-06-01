import { expect, test } from '../../fixtures'
import { STORAGE_STATE } from '../../fixtures/storage-state'

test.use({ storageState: STORAGE_STATE.mustChange })

test.describe('Forced password change', () => {
	test('a must-change user is bounced from /dashboard to /auth/change-password', async ({ page }) => {
		await page.goto('/dashboard')
		await expect(page).toHaveURL(/\/auth\/change-password$/)
	})

	test('a must-change user is bounced from /dashboard/users to /auth/change-password', async ({ page }) => {
		await page.goto('/dashboard/users')
		await expect(page).toHaveURL(/\/auth\/change-password$/)
	})

	test('a must-change user is not redirected away from /auth/change-password (no loop)', async ({ page }) => {
		await page.goto('/auth/change-password')
		await expect(page).toHaveURL(/\/auth\/change-password$/)
		await expect(page.getByLabel('Current password')).toBeVisible()
		await expect(page.getByLabel('New password')).toBeVisible()
	})
})
