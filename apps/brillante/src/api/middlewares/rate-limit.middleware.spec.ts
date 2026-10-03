import { clearAllMocks, fn, spyOn } from '@resetshop/util/test-utils'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'
import {
	getClientIp,
	loginRateLimiter,
	RATE_LIMIT_POLICY,
	type RateLimitBinding,
	type RateLimitBindings,
} from './rate-limit.middleware'

type LimitFn = ReturnType<typeof createLimitMock>

function createLimitMock(success: boolean) {
	return fn<[{ key: string }], Promise<{ success: boolean }>>().mockResolvedValue({ success })
}

function createApp() {
	const app = new Hono<{ Bindings: RateLimitBindings }>()
	app.post('/api/auth/login', loginRateLimiter, (c) => c.json({ ok: true }))
	return app
}

function post(app: ReturnType<typeof createApp>, bindings: RateLimitBindings | undefined, headers: HeadersInit = {}) {
	return app.request('/api/auth/login', { method: 'POST', headers }, bindings)
}

function bindingFrom(limit: LimitFn): RateLimitBinding {
	return { limit }
}

describe('rate limit middleware', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	it('lets the request through when the binding allows it', async () => {
		const limit = createLimitMock(true)

		const response = await post(createApp(), { LOGIN_RATE_LIMITER: bindingFrom(limit) })

		expect(response.status).toBe(200)
		expect(limit.calls).toHaveLength(1)
	})

	it('answers 429 with a Retry-After header equal to the policy period when the binding refuses', async () => {
		const response = await post(createApp(), { LOGIN_RATE_LIMITER: bindingFrom(createLimitMock(false)) })

		expect(response.status).toBe(429)
		expect(response.headers.get('Retry-After')).toBe(String(RATE_LIMIT_POLICY.LOGIN_RATE_LIMITER.periodSeconds))
		expect(await response.json()).toEqual({ error: 'Too many requests. Please try again later.' })
	})

	it('keys the limit on the Cloudflare-provided client IP, ignoring a forged x-forwarded-for', async () => {
		const limit = createLimitMock(true)

		await post(
			createApp(),
			{ LOGIN_RATE_LIMITER: bindingFrom(limit) },
			{
				'cf-connecting-ip': '203.0.113.7',
				'x-forwarded-for': '198.51.100.99',
			},
		)

		expect(limit.calls).toEqual([[{ key: '203.0.113.7' }]])
	})

	it('allows the request and reports the gap once when the binding is not configured', async () => {
		const warnSpy = spyOn(console, 'warn')
		const app = createApp()

		const first = await post(app, undefined)
		const second = await post(app, {})

		expect(first.status).toBe(200)
		expect(second.status).toBe(200)
		expect(warnSpy.calls.filter(([message]) => String(message).includes('LOGIN_RATE_LIMITER'))).toHaveLength(1)
	})

	it('allows the request when the binding itself fails', async () => {
		const warnSpy = spyOn(console, 'warn')
		const limit = fn<[{ key: string }], Promise<{ success: boolean }>>().mockRejectedValue(new Error('binding down'))

		const response = await post(createApp(), { LOGIN_RATE_LIMITER: bindingFrom(limit) })

		expect(response.status).toBe(200)
		expect(warnSpy.calls.some(([message]) => String(message).includes('binding down'))).toBe(true)
	})
})

describe('getClientIp', () => {
	async function ipFor(headers: Record<string, string>): Promise<string> {
		const app = new Hono()
		app.get('/ip', (c) => c.text(getClientIp(c)))
		const response = await app.request('/ip', { headers })
		return response.text()
	}

	it('prefers cf-connecting-ip over the proxy headers', async () => {
		expect(await ipFor({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2', 'x-real-ip': '3.3.3.3' })).toBe(
			'1.1.1.1',
		)
	})

	it('falls back to the first x-forwarded-for entry, then x-real-ip, then "unknown"', async () => {
		expect(await ipFor({ 'x-forwarded-for': '2.2.2.2, 4.4.4.4', 'x-real-ip': '3.3.3.3' })).toBe('2.2.2.2')
		expect(await ipFor({ 'x-real-ip': '3.3.3.3' })).toBe('3.3.3.3')
		expect(await ipFor({})).toBe('unknown')
	})
})
