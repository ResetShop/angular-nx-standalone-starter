import {
	RATE_LIMIT_POLICY,
	type RateLimitBinding,
	type RateLimitBindings,
	type RateLimiterBindingName,
} from '../../middlewares/rate-limit.middleware'

/**
 * Fixed-window stand-in for one Cloudflare Rate Limiting binding. The real binding is eventually
 * consistent and per location; this fake is exact, which is what a deterministic test needs.
 */
function createInMemoryBinding(limit: number, periodSeconds: number): RateLimitBinding {
	const windows = new Map<string, { count: number; resetAt: number }>()

	return {
		limit: ({ key }) => {
			const now = Date.now()
			const current = windows.get(key)
			const window = current && current.resetAt > now ? current : { count: 0, resetAt: now + periodSeconds * 1000 }
			window.count += 1
			windows.set(key, window)
			return Promise.resolve({ success: window.count <= limit })
		},
	}
}

/** One fake per binding of `RATE_LIMIT_POLICY`, with the limits production configures. */
export function createInMemoryRateLimitBindings(): RateLimitBindings {
	const names = Object.keys(RATE_LIMIT_POLICY) as RateLimiterBindingName[]
	return Object.fromEntries(
		names.map((name) => [
			name,
			createInMemoryBinding(RATE_LIMIT_POLICY[name].limit, RATE_LIMIT_POLICY[name].periodSeconds),
		]),
	) as RateLimitBindings
}
