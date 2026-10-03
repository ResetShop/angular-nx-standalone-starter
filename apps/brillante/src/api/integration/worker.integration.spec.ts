import { createFakeExecutionContext } from '../helpers/fake-execution-context.testing'
import worker from '../worker'
import { getTestConnectionString } from './setup/env-helpers'

describe('Worker entry point against a real database', () => {
	const bindings = { HYPERDRIVE: { connectionString: getTestConnectionString() } }

	it('answers the health check through the Worker fetch handler', async () => {
		const executionCtx = createFakeExecutionContext()

		const response = await worker.fetch(new Request('https://brillante.test/api/health/v1'), bindings, executionCtx)
		await executionCtx.settled()

		expect(response.status).toBe(200)
		expect(await response.json()).toMatchObject({ status: 'healthy' })
	})

	it('runs the scheduled token cleanup to completion and releases its connection', async () => {
		const executionCtx = createFakeExecutionContext()
		const event = { cron: '17 3 * * *', scheduledTime: Date.now() }

		await expect(worker.scheduled(event, bindings, executionCtx)).resolves.toBeUndefined()

		await expect(executionCtx.settled()).resolves.toBeUndefined()
		expect(executionCtx.tasks.length).toBeGreaterThan(0)
	})
})
