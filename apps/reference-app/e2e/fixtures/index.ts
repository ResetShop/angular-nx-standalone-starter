import { test as base, expect } from '@playwright/test'

let perWorkerCounter = 0

/**
 * Shared `test`. Two per-test setup concerns, applied to every spec via the `page` fixture:
 *
 * 1. **Distinct client IP** — the per-IP auth rate limiters (`getClientIp` reads `x-forwarded-for`)
 *    would otherwise trip mid-suite because every request shares `127.0.0.1`. A unique `x-forwarded-for`
 *    per test keeps each test's auth calls under the limit independently.
 * 2. **English** — the app's hardcoded default language is Spanish (`environment.defaultLanguage = 'es'`),
 *    but `Translation.resolveInitialLanguage()` reads `localStorage['app_language']` first, so seeding it
 *    before any page script runs lets text-based selectors resolve against `en.ts`.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		const { workerIndex } = base.info()
		perWorkerCounter += 1
		await page.setExtraHTTPHeaders({ 'x-forwarded-for': `10.${workerIndex % 256}.${perWorkerCounter % 256}.10` })
		await page.addInitScript(() => {
			try {
				window.localStorage.setItem('app_language', 'en')
			} catch {
				// No localStorage in this context — nothing to seed.
			}
		})
		await use(page)
	},
})

export { expect }
