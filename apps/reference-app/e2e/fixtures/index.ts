import { test as base, expect } from '@playwright/test'

/**
 * Shared `test`. Two per-test setup concerns, applied to every spec via the `page` fixture:
 *
 * 1. **Distinct client IP** — the per-IP auth rate limiters (`getClientIp` reads `x-forwarded-for`)
 *    would otherwise trip mid-suite because every request shares `127.0.0.1`. A unique `x-forwarded-for`
 *    per test keeps each test's auth calls under the limit independently. The counter lives in a
 *    worker-scoped fixture (not a module variable) and is combined with `workerIndex` for global uniqueness.
 * 2. **English** — the app's hardcoded default language is Spanish (`environment.defaultLanguage = 'es'`).
 *    The config's `locale: 'en-US'` only sets `navigator.language`; the app's `resolveInitialLanguage()`
 *    reads `localStorage['app_language']` first, so it must be seeded separately, before any page script.
 */
export const test = base.extend<object, { ipCounter: { next: () => number } }>({
	ipCounter: [
		async ({}, use) => {
			let count = 0
			await use({ next: () => (count += 1) })
		},
		{ scope: 'worker' },
	],
	page: async ({ page, ipCounter }, use) => {
		const { workerIndex } = test.info()
		const n = ipCounter.next()
		await page.setExtraHTTPHeaders({ 'x-forwarded-for': `10.${workerIndex % 256}.${n % 256}.10` })
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
