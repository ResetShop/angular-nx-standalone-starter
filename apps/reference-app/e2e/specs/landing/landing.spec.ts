import { expect, test } from '../../fixtures'
import { STORAGE_STATE } from '../../fixtures/storage-state'
import { LandingPage } from '../../page-objects/landing.page'

test.describe('Landing page (anonymous)', () => {
	let landing: LandingPage
	test.beforeEach(async ({ page }) => {
		landing = new LandingPage(page)
		await landing.goto()
	})

	test('renders the public marketing page at / with no guard redirect', async ({ page }) => {
		await expect(page).toHaveURL('/')
		await expect(landing.heroHeading).toBeVisible()
		await expect(landing.featuresHeading).toBeVisible()
	})

	test('shows the three feature cards', async () => {
		await expect(landing.authFeatureHeading).toBeVisible()
		await expect(landing.rbacFeatureHeading).toBeVisible()
		await expect(landing.ssrFeatureHeading).toBeVisible()
	})

	test('the hero CTA navigates to the login page', async ({ page }) => {
		await landing.heroCta.click()
		await expect(page).toHaveURL(/\/auth\/login$/)
	})

	test('the header shows the theme toggle and a Sign in link', async () => {
		await expect(landing.themeToggle).toBeVisible()
		await expect(landing.signInLink).toBeVisible()
	})

	test('the skip-to-content link is present', async () => {
		// Visually hidden (sr-only) until focused, so assert presence in the DOM rather than visibility.
		await expect(landing.skipLink).toBeAttached()
	})

	test('does not show the "Go to dashboard" link when unauthenticated', async () => {
		await expect(landing.dashboardLink).toHaveCount(0)
	})
})

// `test.use` inside this describe scopes the admin storageState to the authenticated cases only.
test.describe('Landing page (authenticated cold load)', () => {
	test.use({ storageState: STORAGE_STATE.admin })

	let landing: LandingPage
	test.beforeEach(async ({ page }) => {
		landing = new LandingPage(page)
		await landing.goto()
	})

	test('a visitor with a session cookie is not redirected away from /', async ({ page }) => {
		await expect(page).toHaveURL('/')
	})

	test('the "Go to dashboard" link is absent on a cold load (known gap #468)', async () => {
		// The public landing route runs no session validation and nothing rehydrates `currentUser` from the
		// cookie, so `isAuthenticated()` is false on a cold load and the header's `@if`-guarded "Go to
		// dashboard" link never renders. This asserts the *current* behavior; when #468 is resolved (the
		// link is made reachable, or removed), update this expectation accordingly.
		await expect(landing.dashboardLink).toHaveCount(0)
	})
})
