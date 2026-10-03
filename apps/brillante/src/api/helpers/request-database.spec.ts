/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFakeExecutionContext } from './fake-execution-context.testing'
import {
	createRequestScopedPool,
	isCloudflareWorker,
	requireConnectionString,
	withRequestDatabase,
} from './request-database'

// Nothing listens here, so any test that opens a connection fails: the tests below rely on that to
// prove the connection is only opened when a query is issued.
const UNREACHABLE_CONNECTION_STRING = 'postgres://nobody:none@127.0.0.1:1/none'

describe('isCloudflareWorker', () => {
	const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator')

	beforeEach(() => {
		Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Cloudflare-Workers' }, configurable: true })
	})

	afterEach(() => {
		if (originalNavigator) {
			Object.defineProperty(globalThis, 'navigator', originalNavigator)
		} else {
			Reflect.deleteProperty(globalThis, 'navigator')
		}
	})

	it('is true when the runtime identifies itself as Cloudflare Workers', () => {
		expect(isCloudflareWorker()).toBe(true)
	})

	it('is false for any other runtime', () => {
		Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'Node.js/24' }, configurable: true })

		expect(isCloudflareWorker()).toBe(false)
	})

	it('is false when the runtime exposes no navigator', () => {
		Reflect.deleteProperty(globalThis, 'navigator')

		expect(isCloudflareWorker()).toBe(false)
	})
})

describe('requireConnectionString', () => {
	it('returns the Hyperdrive connection string', () => {
		expect(requireConnectionString({ HYPERDRIVE: { connectionString: 'postgres://hyperdrive' } })).toBe(
			'postgres://hyperdrive',
		)
	})

	it.each([[undefined], [{}], [{ HYPERDRIVE: { connectionString: '' } }]])(
		'throws a descriptive error when the binding is missing or empty (%j)',
		(bindings) => {
			expect(() => requireConnectionString(bindings)).toThrow('HYPERDRIVE binding is not configured')
		},
	)
})

describe('createRequestScopedPool', () => {
	it('refuses database access outside a request or scheduled run', () => {
		const pool = createRequestScopedPool()

		expect(() => pool.query('select 1')).toThrow('No request-scoped database client')
	})
})

describe('withRequestDatabase', () => {
	it('does not open a connection for work that never queries', async () => {
		const executionCtx = createFakeExecutionContext()

		const result = await withRequestDatabase(UNREACHABLE_CONNECTION_STRING, executionCtx, () => Promise.resolve('done'))
		await executionCtx.settled()

		expect(result).toBe('done')
		expect(executionCtx.tasks).toHaveLength(1)
	})

	it('hands the closing step to the platform instead of dropping it when the work throws', async () => {
		const executionCtx = createFakeExecutionContext()

		await expect(
			withRequestDatabase(UNREACHABLE_CONNECTION_STRING, executionCtx, () => Promise.reject(new Error('boom'))),
		).rejects.toThrow('boom')

		await executionCtx.settled()
		expect(executionCtx.tasks).toHaveLength(1)
	})

	it('keeps tracking work that the wrapped work defers, and waits for it before closing', async () => {
		const executionCtx = createFakeExecutionContext()
		const order: string[] = []

		await withRequestDatabase(UNREACHABLE_CONNECTION_STRING, executionCtx, () => {
			executionCtx.waitUntil(
				new Promise<void>((resolve) =>
					setTimeout(() => {
						order.push('deferred work finished')
						resolve()
					}, 20),
				),
			)
			return Promise.resolve()
		})
		order.push('response returned')
		await executionCtx.settled()

		expect(order).toEqual(['response returned', 'deferred work finished'])
	})
})
