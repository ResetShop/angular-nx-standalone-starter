import type { Context } from 'hono'
import { describe, expect, it } from 'vitest'
import { deferAfterResponse } from './defer-after-response'

// Minimal Hono-Context stand-ins exposing only the `executionCtx` surface deferAfterResponse touches.
function ctxWithExecution(waitUntil: (promise: Promise<unknown>) => void): Pick<Context, 'executionCtx'> {
	return { executionCtx: { waitUntil } } as unknown as Pick<Context, 'executionCtx'>
}

function ctxWithoutExecution(): Pick<Context, 'executionCtx'> {
	return {
		get executionCtx(): never {
			// Mirrors Hono: the getter throws when no ExecutionContext is bound (plain Node).
			throw new Error('This context has no ExecutionContext')
		},
	} as unknown as Pick<Context, 'executionCtx'>
}

// Yield to the event loop (a macrotask tick, after the microtask queue drains) so the deferred work settles.
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0))
const noopOnError = (): void => undefined

describe('deferAfterResponse', () => {
	it('runs the deferred work', async () => {
		let ran = 0
		deferAfterResponse(ctxWithoutExecution(), async () => void ran++, { onError: noopOnError })

		await flush()

		expect(ran).toBe(1)
	})

	it('registers the task with executionCtx.waitUntil when available (serverless/edge)', async () => {
		const registered: Promise<unknown>[] = []
		deferAfterResponse(
			ctxWithExecution((promise) => registered.push(promise)),
			async () => undefined,
			{
				onError: noopOnError,
			},
		)

		expect(registered).toHaveLength(1)
		await expect(registered[0]).resolves.toBeUndefined()
	})

	it('never surfaces an unhandled rejection even if onError itself throws', async () => {
		const registered: Promise<unknown>[] = []
		deferAfterResponse(
			ctxWithExecution((promise) => registered.push(promise)),
			async () => Promise.reject(new Error('work failed')),
			{
				onError: () => {
					throw new Error('onError failed')
				},
			},
		)

		// The task registered with waitUntil resolves rather than rejecting, despite the throwing onError.
		await expect(registered[0]).resolves.toBeUndefined()
	})

	it('still runs the work without an ExecutionContext (plain Node) and does not throw', async () => {
		let ran = 0
		expect(() =>
			deferAfterResponse(ctxWithoutExecution(), async () => void ran++, { onError: noopOnError }),
		).not.toThrow()

		await flush()

		expect(ran).toBe(1)
	})

	it('routes a rejection to onError so deferred failures are never silently dropped', async () => {
		const failure = new Error('send failed')
		let received: unknown
		deferAfterResponse(ctxWithoutExecution(), async () => Promise.reject(failure), {
			onError: (error) => void (received = error),
		})

		await flush()

		expect(received).toBe(failure)
	})
})
