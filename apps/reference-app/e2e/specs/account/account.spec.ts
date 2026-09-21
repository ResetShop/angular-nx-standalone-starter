import { expect, test } from '../../fixtures'
import { AccountPage } from '../../page-objects/account.page'
import { DashboardPage } from '../../page-objects/dashboard.page'
import { LoginPage } from '../../page-objects/login.page'
import { accountEditorEmail, adminPassword } from '../../setup/db-seed'

// Renames persist through the real API (no route mocks): reading the new name back after a full reload
// is the point. Each browser project signs in as its own seeded non-admin user so parallel projects
// never rename the same row.
test.describe('Account page — non-admin user', () => {
	const email = () => accountEditorEmail(test.info().project.name)

	let account: AccountPage
	test.beforeEach(async ({ page }) => {
		account = new AccountPage(page)
		const login = new LoginPage(page)
		await login.goto()
		await login.login(email(), adminPassword())
		await expect(page).toHaveURL(/\/dashboard$/)
	})

	test('reaches the account page from the sidebar without any admin permission', async ({ page }) => {
		const dashboard = new DashboardPage(page)
		await dashboard.sidebar.getByRole('link', { name: 'Account', exact: true }).click()

		await expect(page).toHaveURL(/\/account$/)
		await expect(account.heading).toBeVisible()
		await expect(dashboard.breadcrumb).toContainText('Account')
	})

	test('shows the email as read-only text next to the editable name fields', async () => {
		await account.goto()

		await expect(account.profile.getByText(email(), { exact: true })).toBeVisible()
		await expect(account.textboxes).toHaveCount(2)
		await expect(account.firstNameInput).toBeEditable()
		await expect(account.lastNameInput).toBeEditable()
	})

	test('a confirmed rename is saved and survives a full page reload', async ({ page }) => {
		const firstName = `Grace${Date.now()}`
		await account.goto()

		await account.renameFirstName(firstName)

		await expect(account.successToast).toBeVisible()
		await expect(account.firstNameInput).toHaveValue(firstName)

		await page.reload()

		await expect(account.firstNameInput).toHaveValue(firstName)
	})
})
