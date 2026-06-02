import { expect, test } from '../../fixtures'
import { STORAGE_STATE } from '../../fixtures/storage-state'
import { UserDetailPage } from '../../page-objects/user-detail.page'

const VIEWABLE_ID = process.env['E2E_VIEWABLE_USER_ID'] ?? ''
const ADMIN_ID = process.env['E2E_ADMIN_USER_ID'] ?? ''

// Mutating success paths are mocked (page.route, method-guarded) so the shared DB is never written.
test.describe('User detail — admin viewing another user', () => {
	test.use({ storageState: STORAGE_STATE.admin })

	let detail: UserDetailPage
	test.beforeEach(async ({ page }) => {
		detail = new UserDetailPage(page)
		await detail.goto(VIEWABLE_ID)
	})

	test('renders the profile, roles, and account-actions sections plus the back link', async () => {
		await expect(detail.profileHeading).toBeVisible()
		await expect(detail.rolesHeading).toBeVisible()
		await expect(detail.accountActionsHeading).toBeVisible()
		await expect(detail.backLink).toBeVisible()
	})

	test('saves profile changes with a success toast', async ({ page }) => {
		await page.route(/\/api\/users\/\d+$/, async (route) => {
			if (route.request().method() === 'PATCH') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						id: Number(VIEWABLE_ID),
						email: 'e2e-viewable@test.com',
						firstName: 'Veronica',
						lastName: 'Viewable',
						status: 'active',
						roles: [],
					}),
				})
				return
			}
			await route.continue()
		})
		await detail.firstNameInput.fill('Veronica')
		await detail.saveButton.click()
		await expect(page.getByText('User updated successfully.')).toBeVisible()
		await page.unroute(/\/api\/users\/\d+$/)
	})

	test('opens the edit-roles drawer', async ({ page }) => {
		await detail.editRolesButton.click()
		await expect(page.getByText('Edit Roles', { exact: true })).toBeVisible()
	})

	test('disables the user with confirmation and a success toast', async ({ page }) => {
		await page.route(/\/api\/users\/\d+\/status$/, async (route) => {
			if (route.request().method() === 'PATCH') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						id: Number(VIEWABLE_ID),
						email: 'e2e-viewable@test.com',
						firstName: 'Vera',
						lastName: 'Viewable',
						status: 'disabled',
						roles: [],
					}),
				})
				return
			}
			await route.continue()
		})
		await detail.disableButton.click()
		await detail.confirmButton('Disable user').click()
		await expect(page.getByText('User disabled successfully.')).toBeVisible()
		await page.unroute(/\/api\/users\/\d+\/status$/)
	})

	test('the back link returns to the users list', async ({ page }) => {
		await detail.backLink.click()
		await expect(page).toHaveURL('/dashboard/users')
	})

	test('deletes the user and redirects to the list', async ({ page }) => {
		await page.route(/\/api\/users\/\d+$/, async (route) => {
			if (route.request().method() === 'DELETE') {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ message: 'User deleted successfully' }),
				})
				return
			}
			await route.continue()
		})
		await detail.deleteButton.click()
		await detail.confirmButton('Delete').click()
		await expect(page).toHaveURL('/dashboard/users')
		await page.unroute(/\/api\/users\/\d+$/)
	})
})

test.describe('User detail — admin viewing own account', () => {
	test.use({ storageState: STORAGE_STATE.admin })

	let detail: UserDetailPage
	test.beforeEach(async ({ page }) => {
		detail = new UserDetailPage(page)
		await detail.goto(ADMIN_ID)
	})

	test('hides the account-actions card and danger zone on self-view', async () => {
		await expect(detail.profileHeading).toBeVisible()
		await expect(detail.accountActionsHeading).toHaveCount(0)
		await expect(detail.deleteButton).toHaveCount(0)
	})

	test('locks the admin role in the edit-roles drawer when editing self', async ({ page }) => {
		await detail.editRolesButton.click()
		await expect(page.getByText('Edit Roles', { exact: true })).toBeVisible()
		await expect(page.getByRole('checkbox', { name: 'Administrator' })).toBeDisabled()
	})
})

test.describe('User detail — permission gating', () => {
	test.use({ storageState: STORAGE_STATE.noPermission })

	test('a no-permission user deep-linking a detail page is redirected with a deny toast', async ({ page }) => {
		await page.goto('/dashboard/users/1')
		await expect(page).toHaveURL('/dashboard')
		// Redirect is the security-critical assertion. The deny toast appears; `.first()` because on a
		// detail deep-link two toast elements were observed (vs one on the list route) — tracked in #471.
		await expect(page.getByText("You don't have permission to access that page.").first()).toBeVisible()
	})
})
