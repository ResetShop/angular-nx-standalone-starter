import { expect, test } from '../../fixtures'
import { STORAGE_STATE } from '../../fixtures/storage-state'

test.describe('Theme & i18n', () => {
	test.use({ storageState: STORAGE_STATE.admin })

	test('toggles the theme and persists it across a reload', async ({ page }) => {
		await page.goto('/dashboard')
		const html = page.locator('html')
		// Default (no stored preference, light color-scheme) is light.
		await expect(html).not.toHaveClass(/dark/)

		await page.getByRole('button', { name: 'Switch to dark mode' }).click()
		await expect(html).toHaveClass(/dark/)

		// ThemeProvider persists to localStorage['theme-preference']; the test fixture only seeds the
		// language key, so a reload keeps the dark theme.
		await page.reload()
		await expect(html).toHaveClass(/dark/)
		await expect(page.getByRole('button', { name: 'Switch to light mode' })).toBeVisible()
	})

	test('switches the UI language to Spanish and persists the choice', async ({ page }) => {
		await page.goto('/dashboard/settings')
		await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

		await page.getByRole('combobox').click()
		await page.getByTestId('select-dropdown').getByText('Spanish').click()

		// The UI re-renders in Spanish (TranslatePipe reacts to the language change).
		await expect(page.getByRole('heading', { name: 'Ajustes' })).toBeVisible()
		// The choice is persisted to localStorage. (A full reload would be re-forced to English by the test
		// fixture's addInitScript, so assert the persisted value rather than reload.)
		const stored = await page.evaluate(() => window.localStorage.getItem('app_language'))
		expect(stored).toBe('es')
	})
})
