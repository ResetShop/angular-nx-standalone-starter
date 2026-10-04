/**
 * @vitest-environment node
 */
import { clearAllMocks } from '@resetshop/util/test-utils'
import { createServer, type AddressInfo, type Server } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createFakeExecutionContext } from './helpers/fake-execution-context.testing'
import worker from './worker'

// A listener that records every TCP connection: the requests below must be answered without the
// Worker ever opening a database connection, which this can observe and a refused port cannot.
let databaseListener: Server
let connectionAttempts = 0
let unreachableDatabase: { connectionString: string }

beforeAll(async () => {
	databaseListener = createServer((socket) => {
		connectionAttempts += 1
		socket.destroy()
	})
	await new Promise<void>((resolve) => databaseListener.listen(0, '127.0.0.1', resolve))
	const { port } = databaseListener.address() as AddressInfo
	unreachableDatabase = { connectionString: `postgres://nobody:none@127.0.0.1:${port}/none` }
})

afterAll(async () => {
	await new Promise((resolve) => databaseListener.close(resolve))
})

async function request(path: string, bindings: Record<string, unknown>) {
	const executionCtx = createFakeExecutionContext()
	const response = await worker.fetch(new Request(`https://brillante.test${path}`), bindings, executionCtx)
	await executionCtx.settled()
	return response
}

describe('Worker entry point', () => {
	beforeEach(() => {
		clearAllMocks()
		connectionAttempts = 0
	})

	it('serves the OpenAPI document without touching the database', async () => {
		const response = await request('/api/openapi.json', { HYPERDRIVE: unreachableDatabase })

		expect(response.status).toBe(200)
		expect(await response.json()).toMatchObject({ openapi: '3.0.0' })
		expect(connectionAttempts).toBe(0)
	})

	it('serves the Swagger UI page without touching the database', async () => {
		const response = await request('/api/docs', { HYPERDRIVE: unreachableDatabase })

		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toContain('text/html')
		expect(connectionAttempts).toBe(0)
	})

	it('rejects protected routes without an access token before any database access', async () => {
		const response = await request('/api/users', { HYPERDRIVE: unreachableDatabase })

		expect(response.status).toBe(401)
		expect(connectionAttempts).toBe(0)
	})

	it('fails the request when the Hyperdrive binding is missing instead of hanging', async () => {
		const response = await request('/api/openapi.json', {})

		expect(response.status).toBe(500)
	})

	it('exposes a scheduled handler that refuses to run without the Hyperdrive binding', async () => {
		const event = { cron: '17 3 * * *', scheduledTime: Date.now() }

		await expect(worker.scheduled(event, {}, createFakeExecutionContext())).rejects.toThrow(
			'HYPERDRIVE binding is not configured',
		)
	})
})
