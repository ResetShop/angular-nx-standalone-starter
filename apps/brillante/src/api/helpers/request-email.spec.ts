import { clearAllMocks, fn } from '@resetshop/util/test-utils'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'
import { type EmailBindings, requestEmailMiddleware, requireEmailBinding, type SendEmailBinding } from './request-email'

describe('requestEmailMiddleware', () => {
	let send: ReturnType<typeof fn<[unknown], Promise<{ messageId: string }>>>
	let binding: SendEmailBinding

	beforeEach(() => {
		clearAllMocks()
		send = fn()
		send.mockResolvedValue({ messageId: 'm-1' })
		binding = { send }
	})

	function buildApp() {
		const app = new Hono<{ Bindings: EmailBindings }>()
		app.use('*', requestEmailMiddleware())
		app.get('/binding', (c) => c.json({ same: requireEmailBinding() === binding }))
		app.get('/after', async (c) => {
			// Work registered during the request keeps the binding after the handler has returned.
			const deferred = new Promise<boolean>((resolve) =>
				setTimeout(() => resolve(requireEmailBinding() === binding), 0),
			)
			return c.json({ same: await deferred })
		})
		return app
	}

	it('gives the handler the binding of the request', async () => {
		const res = await buildApp().request('/binding', {}, { EMAIL: binding })

		expect(await res.json()).toEqual({ same: true })
	})

	it('keeps the binding for work that continues after an await', async () => {
		const res = await buildApp().request('/after', {}, { EMAIL: binding })

		expect(await res.json()).toEqual({ same: true })
	})

	it('keeps each concurrent request on its own binding', async () => {
		const other: SendEmailBinding = { send }
		const app = new Hono<{ Bindings: EmailBindings }>()
		app.use('*', requestEmailMiddleware())
		app.get('/:id', async (c) => {
			await new Promise((resolve) => setTimeout(resolve, c.req.param('id') === 'slow' ? 20 : 0))
			const expected = c.req.param('id') === 'slow' ? binding : other
			return c.json({ own: requireEmailBinding() === expected })
		})

		const [slow, fast] = await Promise.all([
			app.request('/slow', {}, { EMAIL: binding }),
			app.request('/fast', {}, { EMAIL: other }),
		])

		expect(await slow.json()).toEqual({ own: true })
		expect(await fast.json()).toEqual({ own: true })
	})

	it('serves the request without a binding and refuses to hand one out', async () => {
		const app = new Hono<{ Bindings: EmailBindings }>()
		app.use('*', requestEmailMiddleware())
		app.get('/', () => {
			requireEmailBinding()
			return new Response('unreachable')
		})
		app.onError((error, c) => c.json({ error: error.message }, 500))

		const res = await app.request('/')

		expect(res.status).toBe(500)
		expect(await res.json()).toEqual({ error: expect.stringContaining('EMAIL binding is not available') })
	})
})
