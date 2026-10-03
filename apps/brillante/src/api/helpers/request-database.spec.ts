/**
 * @vitest-environment node
 */
import { clearAllMocks, fn, spyOn } from '@resetshop/util/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFakeExecutionContext } from './fake-execution-context.testing'
import {
	createRequestScopedPool,
	type DatabaseClient,
	isCloudflareWorker,
	requireConnectionString,
	withRequestDatabase,
} from './request-database'

/**
 * Records how the scope drives its client. `connectFails` makes `connect()` reject the way an
 * unreachable database does.
 */
function createFakeClient(options: { connectFails?: boolean } = {}) {
	const events: string[] = []
	const connect = fn<[], Promise<void>>().mockImplementation(() => {
		events.push('connect')
		return options.connectFails ? Promise.reject(new Error('connect failed')) : Promise.resolve()
	})
	const end = fn<[], Promise<void>>().mockImplementation(() => {
		events.push('end')
		return Promise.resolve()
	})
	const on = fn<[string, (error: Error) => void], unknown>()
	const query = fn<[string], Promise<{ rows: unknown[] }>>().mockResolvedValue({ rows: [] })
	// REASON: `connect` is overloaded (callback and promise forms) and `on` returns the client, so the
	// recording mocks cannot satisfy `Pick<Client, ...>` structurally; the scope only uses these members.
	const client = { connect, end, on, query } as unknown as DatabaseClient
	return { client, connect, end, on, query, events }
}

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
	beforeEach(() => {
		clearAllMocks()
	})

	it('does not open a connection for work that never queries', async () => {
		const fake = createFakeClient()
		const executionCtx = createFakeExecutionContext()

		const result = await withRequestDatabase(
			'postgres://unused',
			executionCtx,
			() => Promise.resolve('done'),
			() => fake.client,
		)
		await executionCtx.settled()

		expect(result).toBe('done')
		expect(fake.connect.calls).toHaveLength(0)
		expect(fake.end.calls).toHaveLength(0)
	})

	it('connects on the first query only and reuses the connection for later queries', async () => {
		const fake = createFakeClient()
		const executionCtx = createFakeExecutionContext()

		await withRequestDatabase(
			'postgres://unused',
			executionCtx,
			async () => {
				await createRequestScopedPool().query('select 1')
				await createRequestScopedPool().query('select 2')
			},
			() => fake.client,
		)
		await executionCtx.settled()

		expect(fake.connect.calls).toHaveLength(1)
		expect(fake.query.calls).toEqual([['select 1'], ['select 2']])
		expect(fake.end.calls).toHaveLength(1)
	})

	it('hands the closing step to the platform and closes the connection when the work throws', async () => {
		const fake = createFakeClient()
		const executionCtx = createFakeExecutionContext()

		await expect(
			withRequestDatabase(
				'postgres://unused',
				executionCtx,
				async () => {
					await createRequestScopedPool().query('select 1')
					throw new Error('boom')
				},
				() => fake.client,
			),
		).rejects.toThrow('boom')
		await executionCtx.settled()

		expect(executionCtx.tasks).toHaveLength(1)
		expect(fake.end.calls).toHaveLength(1)
	})

	it('waits for work the wrapped work defers before closing the connection', async () => {
		const fake = createFakeClient()
		const executionCtx = createFakeExecutionContext()

		await withRequestDatabase(
			'postgres://unused',
			executionCtx,
			async () => {
				await createRequestScopedPool().query('select 1')
				executionCtx.waitUntil(
					new Promise<void>((resolve) =>
						setTimeout(() => {
							fake.events.push('deferred work finished')
							resolve()
						}, 20),
					),
				)
			},
			() => fake.client,
		)
		fake.events.push('response returned')
		await executionCtx.settled()

		expect(fake.events).toEqual(['connect', 'response returned', 'deferred work finished', 'end'])
	})

	it('still closes cleanly when the connection could not be opened', async () => {
		const fake = createFakeClient({ connectFails: true })
		const executionCtx = createFakeExecutionContext()

		await withRequestDatabase(
			'postgres://unreachable',
			executionCtx,
			async () => {
				await createRequestScopedPool().query('select 1')
			},
			() => fake.client,
		)

		await expect(executionCtx.settled()).resolves.toBeUndefined()
		expect(fake.connect.calls).toHaveLength(1)
	})

	it('registers an error listener so a dropped idle connection is logged instead of thrown', async () => {
		const warnSpy = spyOn(console, 'warn')
		const fake = createFakeClient()
		const executionCtx = createFakeExecutionContext()

		await withRequestDatabase(
			'postgres://unused',
			executionCtx,
			() => Promise.resolve(),
			() => fake.client,
		)
		await executionCtx.settled()

		const [eventName, listener] = fake.on.calls[0]
		expect(eventName).toBe('error')
		listener(new Error('connection reset'))
		expect(warnSpy.calls.some(([message]) => String(message).includes('connection reset'))).toBe(true)
	})
})
