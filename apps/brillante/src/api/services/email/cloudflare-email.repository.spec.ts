import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { Hono } from 'hono'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetEmailEnv, seedEmailEnv } from '../../config/email.env'
import { type EmailBindings, requestEmailMiddleware, type SendEmailMessage } from '../../helpers/request-email'
import { CloudflareEmailRepository } from './cloudflare-email.repository'

describe('CloudflareEmailRepository', () => {
	let send: MockFn<[SendEmailMessage], Promise<{ messageId: string }>>
	const params = { to: 'staff@brillantestore.com', subject: 'Set your password', html: '<p>Hi</p>', text: 'Hi' }

	beforeEach(() => {
		clearAllMocks()
		resetEmailEnv()
		seedEmailEnv({ EMAIL_PROVIDER: 'cloudflare', EMAIL_FROM: 'no-reply@brillantestore.com' })
		send = fn()
		send.mockResolvedValue({ messageId: 'm-1' })
	})

	/** Runs `work` inside a request that carries the EMAIL binding, as the Worker does. */
	async function inRequest(
		work: () => Promise<void>,
		bindings: EmailBindings = { EMAIL: { send } },
	): Promise<Response> {
		const app = new Hono<{ Bindings: EmailBindings }>()
		app.use('*', requestEmailMiddleware())
		app.get('/', async (c) => {
			await work()
			return c.text('ok')
		})
		app.onError((error, c) => c.json({ error: error.message }, 500))
		return app.request('/', {}, bindings)
	}

	it('sends the message through the binding from the configured address', async () => {
		await inRequest(() => new CloudflareEmailRepository().send(params))

		expect(send.calls).toEqual([
			[
				{
					from: 'no-reply@brillantestore.com',
					to: params.to,
					subject: params.subject,
					html: params.html,
					text: params.text,
				},
			],
		])
	})

	it('adds the display name when one is configured', async () => {
		seedEmailEnv({
			EMAIL_PROVIDER: 'cloudflare',
			EMAIL_FROM: 'no-reply@brillantestore.com',
			EMAIL_FROM_NAME: 'Brillante',
		})

		await inRequest(() => new CloudflareEmailRepository().send(params))

		expect(send.calls[0][0].from).toEqual({ email: 'no-reply@brillantestore.com', name: 'Brillante' })
	})

	it('reports the code the Email Service gives for a refused message', async () => {
		send.mockRejectedValue(Object.assign(new Error('Sender not verified'), { code: 'E_SENDER_NOT_VERIFIED' }))

		const res = await inRequest(() => new CloudflareEmailRepository().send(params))

		expect(res.status).toBe(500)
		expect(await res.json()).toEqual({
			error: 'Cloudflare Email Service refused the message (E_SENDER_NOT_VERIFIED)',
		})
	})

	it('does not put the message of the binding, which may name the recipient, in the error', async () => {
		send.mockRejectedValue(Object.assign(new Error(`cannot deliver to ${params.to}`), { code: 'E_VALIDATION_ERROR' }))

		const res = await inRequest(() => new CloudflareEmailRepository().send(params))

		expect(JSON.stringify(await res.json())).not.toContain(params.to)
	})

	it('fails clearly outside a request, where there is no binding', async () => {
		await expect(new CloudflareEmailRepository().send(params)).rejects.toThrow(/EMAIL binding is not available/)
	})

	it('fails clearly when the sender address is not configured', async () => {
		seedEmailEnv({ EMAIL_PROVIDER: 'ethereal' })

		const res = await inRequest(() => new CloudflareEmailRepository().send(params))

		expect(await res.json()).toEqual({ error: 'EMAIL_FROM is required when EMAIL_PROVIDER=cloudflare' })
	})
})
