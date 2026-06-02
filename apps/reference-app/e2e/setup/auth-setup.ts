/**
 * Playwright `setup` project — logs each fixture user in through the real login page and captures its
 * authenticated storageState (HttpOnly session cookies). Browser projects depend on this via
 * `dependencies: ['setup']`, so the state files exist before any spec runs.
 *
 * The must-change fixture user is still seeded (see db-seed.ts) but not captured here — the forced-change
 * spec logs it in fresh rather than reusing a stored state.
 */
import { test as setup } from '../fixtures'
import { STORAGE_STATE } from '../fixtures/storage-state'
import { adminPassword, E2E_USERS } from './db-seed'

async function login(page: import('@playwright/test').Page, email: string): Promise<void> {
	await page.goto('/auth/login')
	await page.getByLabel('Email address').fill(email)
	await page.getByLabel('Password').fill(adminPassword())
	await page.getByRole('button', { name: 'Sign in' }).click()
	await page.waitForURL('**/dashboard')
}

setup('authenticate as admin', async ({ page }) => {
	await login(page, E2E_USERS.admin)
	await page.context().storageState({ path: STORAGE_STATE.admin })
})

setup('authenticate as no-permission user', async ({ page }) => {
	// Zero-permission user (Restricted role) — lands on /dashboard with the no-module-access empty state.
	await login(page, E2E_USERS.noPermission)
	await page.context().storageState({ path: STORAGE_STATE.noPermission })
})
