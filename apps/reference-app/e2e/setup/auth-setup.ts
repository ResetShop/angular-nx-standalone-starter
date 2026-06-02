/**
 * Playwright `setup` project — logs the admin fixture user in through the real login page and captures
 * its authenticated storageState (HttpOnly session cookies). Browser projects depend on this via
 * `dependencies: ['setup']`, so the state file exists before any spec runs.
 *
 * Only the admin state is captured here — it's the one consumed by the authenticated auth specs. The
 * no-permission and must-change fixture users are still seeded (see db-seed.ts) for the later epic
 * slices (#461/#462) and the forced-change spec, which log in fresh rather than reuse a stored state.
 */
import { test as setup } from '../fixtures'
import { STORAGE_STATE } from '../fixtures/storage-state'
import { adminPassword, E2E_USERS } from './db-seed'

setup('authenticate as admin', async ({ page }) => {
	await page.goto('/auth/login')
	await page.getByLabel('Email address').fill(E2E_USERS.admin)
	await page.getByLabel('Password').fill(adminPassword())
	await page.getByRole('button', { name: 'Sign in' }).click()
	await page.waitForURL('**/dashboard')
	await page.context().storageState({ path: STORAGE_STATE.admin })
})
