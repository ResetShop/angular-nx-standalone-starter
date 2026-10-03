/**
 * @vitest-environment node
 */
import { clearAllMocks } from '@resetshop/util/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFakeExecutionContext } from './helpers/fake-execution-context.testing'
import worker from './worker'

// Nothing listens here: the requests below must be answered without opening a database connection.
const unreachableDatabase = { connectionString: 'postgres://nobody:none@127.0.0.1:1/none' }

function request(path: string, bindings: Record<string, unknown>) {
	return worker.fetch(new Request(`https://brillante.test${path}`), bindings, createFakeExecutionContext())
}

describe('Worker entry point', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	it('serves the OpenAPI document without touching the database', async () => {
		const response = await request('/api/openapi.json', { HYPERDRIVE: unreachableDatabase })

		expect(response.status).toBe(200)
		expect(await response.json()).toMatchObject({ openapi: '3.0.0' })
	})

	it('serves the Swagger UI page without touching the database', async () => {
		const response = await request('/api/docs', { HYPERDRIVE: unreachableDatabase })

		expect(response.status).toBe(200)
		expect(response.headers.get('content-type')).toContain('text/html')
	})

	it('rejects protected routes without an access token before any database access', async () => {
		const response = await request('/api/users', { HYPERDRIVE: unreachableDatabase })

		expect(response.status).toBe(401)
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
