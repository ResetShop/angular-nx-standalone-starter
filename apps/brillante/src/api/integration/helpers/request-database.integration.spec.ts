import { deferAfterResponse } from '@resetshop/hono-core'
import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { createFakeExecutionContext } from '../../helpers/fake-execution-context.testing'
import {
	createRequestScopedPool,
	type DatabaseBindings,
	requestDatabaseMiddleware,
	withRequestDatabase,
} from '../../helpers/request-database'
import { getTestDb } from '../setup/db-helpers'
import { getTestConnectionString } from '../setup/env-helpers'

async function backendPid(): Promise<number> {
	const result = await createRequestScopedPool().query<{ pid: number }>('select pg_backend_pid() as pid')
	return result.rows[0].pid
}

describe('request-scoped database client', () => {
	const connectionString = getTestConnectionString()

	it('runs queries made through the shared handle on the client of the current scope', async () => {
		const executionCtx = createFakeExecutionContext()

		const result = await withRequestDatabase(connectionString, executionCtx, async () => {
			const rows = await createRequestScopedPool().query<{ one: number }>('select 1 as one')
			return rows.rows[0].one
		})
		await executionCtx.settled()

		expect(result).toBe(1)
	})

	it('gives concurrent scopes their own connection while the handle stays shared', async () => {
		const measure = () =>
			withRequestDatabase(connectionString, createFakeExecutionContext(), async () => {
				const first = await backendPid()
				await new Promise((resolve) => setTimeout(resolve, 20))
				return { first, second: await backendPid() }
			})

		const [a, b] = await Promise.all([measure(), measure()])

		expect(a.first).toBe(a.second)
		expect(b.first).toBe(b.second)
		expect(a.first).not.toBe(b.first)
	})

	it('keeps the connection open for work deferred after the response, then closes it', async () => {
		const executionCtx = createFakeExecutionContext()
		let scopePid = 0
		let deferredQueryResult: 'ran' | 'failed' | 'pending' = 'pending'

		await withRequestDatabase(connectionString, executionCtx, async () => {
			scopePid = await backendPid()
			// Mirrors deferAfterResponse: work that starts before the response is flushed and keeps
			// querying after the handler has returned.
			executionCtx.waitUntil(
				new Promise((resolve) => setTimeout(resolve, 30))
					.then(() => createRequestScopedPool().query('select 1'))
					.then(
						() => {
							deferredQueryResult = 'ran'
						},
						() => {
							deferredQueryResult = 'failed'
						},
					),
			)
		})
		await executionCtx.settled()

		expect(deferredQueryResult).toBe('ran')

		const stillConnected = await getTestDb().execute<{ n: number }>(
			sql`select count(*)::int as n from pg_stat_activity where pid = ${scopePid}`,
		)
		expect(stillConnected.rows[0].n).toBe(0)
	})

	it('keeps the connection open for work deferred through deferAfterResponse on a real Hono context', async () => {
		// Pins the assumption the tracking relies on: the `c.executionCtx` that deferAfterResponse
		// reads is the object whose `waitUntil` the middleware wrapped.
		const app = new Hono<{ Bindings: DatabaseBindings }>()
		app.use('*', requestDatabaseMiddleware())
		let deferredQueryResult: 'ran' | 'failed' | 'pending' = 'pending'
		app.get('/deferred', (c) => {
			deferAfterResponse(
				c,
				async () => {
					await new Promise((resolve) => setTimeout(resolve, 30))
					await createRequestScopedPool().query('select 1')
					deferredQueryResult = 'ran'
				},
				{
					onError: () => {
						deferredQueryResult = 'failed'
					},
				},
			)
			return c.text('ok')
		})
		const executionCtx = createFakeExecutionContext()

		const response = await app.fetch(
			new Request('https://brillante.test/deferred'),
			{ HYPERDRIVE: { connectionString } },
			executionCtx,
		)
		await executionCtx.settled()

		expect(response.status).toBe(200)
		expect(deferredQueryResult).toBe('ran')
	})
})
