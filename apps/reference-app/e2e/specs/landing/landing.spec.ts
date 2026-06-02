import { expect, test } from '../../fixtures'
import { STORAGE_STATE } from '../../fixtures/storage-state'
import { LandingPage } from '../../page-objects/landing.page'

test.describe('Landing page (anonymous)', () => {
	test('renders the public marketing page at / with no guard redirect', async ({ page }) => {
		const landing = new LandingPage(page)
		await landing.goto()
		await expect(page).toHaveURL(/\/$/)
		await expect(landing.heroHeading).toBeVisible()
		await expect(landing.featuresHeading).toBeVisible()
	})

	test('shows the three feature cards', async ({ page }) => {
		const landing = new LandingPage(page)
		await landing.goto()
		await expect(page.getByRole('heading', { name: 'Authentication' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Role-based access control' })).toBeVisible()
		await expect(page.getByRole('heading', { name: 'Server-side rendering' })).toBeVisible()
	})

	test('the hero CTA navigates to the login page', async ({ page }) => {
		const landing = new LandingPage(page)
		await landing.goto()
		await landing.heroCta.click()
		await expect(page).toHaveURL(/\/auth\/login$/)
	})

	test('the header shows the theme toggle and a Sign in link', async ({ page }) => {
		const landing = new LandingPage(page)
		await landing.goto()
		await expect(landing.themeToggle).toBeVisible()
		await expect(landing.signInLink).toBeVisible()
	})

	test('the skip-to-content link is present', async ({ page }) => {
		const landing = new LandingPage(page)
		await landing.goto()
		// Visually hidden (sr-only) until focused, so assert presence in the DOM rather than visibility.
		await expect(landing.skipLink).toBeAttached()
	})

	test('does not show the "Go to dashboard" link when unauthenticated', async ({ page }) => {
		const landing = new LandingPage(page)
		await landing.goto()
		await expect(landing.dashboardLink).toHaveCount(0)
	})
})

test.describe('Landing page (authenticated cold load)', () => {
	test.use({ storageState: STORAGE_STATE.admin })

	test('a visitor with a session cookie is not redirected away from /', async ({ page }) => {
		const landing = new LandingPage(page)
		await landing.goto()
		await expect(page).toHaveURL(/\/$/)
	})

	test('the "Go to dashboard" link is absent on a cold load (known gap #468)', async ({ page }) => {
		const landing = new LandingPage(page)
		await landing.goto()
		// The public landing route runs no session validation and nothing rehydrates `currentUser` from the
		// cookie, so `isAuthenticated()` is false on a cold load and the header's `@if`-guarded "Go to
		// dashboard" link never renders. This asserts the *current* behavior; when #468 is resolved (the
		// link is made reachable, or removed), update this expectation accordingly.
		await expect(landing.dashboardLink).toHaveCount(0)
	})
})
