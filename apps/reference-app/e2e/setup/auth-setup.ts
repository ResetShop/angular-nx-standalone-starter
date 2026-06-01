/**
 * Playwright `setup` project — logs each fixture user in through the real login page and captures their
 * authenticated storageState (HttpOnly session cookies). Browser projects depend on this via
 * `dependencies: ['setup']`, so the state files exist before any spec runs.
 */
import { test as setup } from '@playwright/test'
import { STORAGE_STATE } from '../fixtures/storage-state'
import { E2E_USERS } from './db-seed'

const password = process.env['INTEGRATION_TEST_ADMIN_PASSWORD'] ?? ''

async function login(page: import('@playwright/test').Page, email: string): Promise<void> {
	await page.goto('/auth/login')
	await page.getByLabel('Email address').fill(email)
	await page.getByLabel('Password').fill(password)
	await page.getByRole('button', { name: 'Sign in' }).click()
}

setup('authenticate as admin', async ({ page }) => {
	await login(page, E2E_USERS.admin)
	await page.waitForURL('**/dashboard')
	await page.context().storageState({ path: STORAGE_STATE.admin })
})

setup('authenticate as no-permission user', async ({ page }) => {
	await login(page, E2E_USERS.noPermission)
	await page.waitForURL('**/dashboard')
	await page.context().storageState({ path: STORAGE_STATE.noPermission })
})

setup('authenticate as must-change-password user', async ({ page }) => {
	// forcedPasswordChangeGuard bounces this user from /dashboard to /auth/change-password.
	await login(page, E2E_USERS.mustChange)
	await page.waitForURL(/\/auth\/change-password|\/dashboard/)
	await page.context().storageState({ path: STORAGE_STATE.mustChange })
})
