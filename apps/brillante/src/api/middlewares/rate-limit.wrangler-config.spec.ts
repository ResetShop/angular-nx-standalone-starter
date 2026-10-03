/**
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { RATE_LIMIT_POLICY } from './rate-limit.middleware'

interface WranglerRateLimit {
	name: string
	namespace_id: string
	simple: { limit: number; period: number }
}

// The Rate Limiting bindings are declared in wrangler.jsonc, outside the TypeScript program, so
// nothing but this spec ties them to RATE_LIMIT_POLICY. A drift would silently change the limit or
// make the `Retry-After` header lie about the window.
describe('wrangler.jsonc rate limit bindings', () => {
	const configPath = resolve(import.meta.dirname, '../../../../../wrangler.jsonc')
	const parsed = ts.parseConfigFileTextToJson(configPath, readFileSync(configPath, 'utf8'))
	const ratelimits: WranglerRateLimit[] = parsed.config?.ratelimits ?? []

	it('declares exactly the bindings of RATE_LIMIT_POLICY, with the same limit and period', () => {
		const declared = Object.fromEntries(
			ratelimits.map((entry) => [entry.name, { limit: entry.simple.limit, periodSeconds: entry.simple.period }]),
		)

		expect(declared).toEqual(RATE_LIMIT_POLICY)
	})

	it('uses a unique namespace id per binding', () => {
		const ids = ratelimits.map((entry) => entry.namespace_id)

		expect(new Set(ids).size).toBe(ids.length)
	})

	it('only uses the 10 s or 60 s windows Cloudflare supports', () => {
		for (const entry of ratelimits) {
			expect([10, 60]).toContain(entry.simple.period)
		}
	})
})
