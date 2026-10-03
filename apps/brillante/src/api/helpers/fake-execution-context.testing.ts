/**
 * Stand-in for Cloudflare's `ExecutionContext`: records every task handed to `waitUntil` so a test
 * can wait for the post-response work the platform would keep alive.
 */
export interface FakeExecutionContext {
	readonly tasks: Promise<unknown>[]
	waitUntil(task: Promise<unknown>): void
	passThroughOnException(): void
	settled(): Promise<void>
}

export function createFakeExecutionContext(): FakeExecutionContext {
	const tasks: Promise<unknown>[] = []

	return {
		tasks,
		waitUntil(task) {
			tasks.push(task)
		},
		passThroughOnException() {
			// Not used by the Worker; present to satisfy the platform interface.
		},
		async settled() {
			let settledCount = -1
			while (settledCount !== tasks.length) {
				settledCount = tasks.length
				await Promise.allSettled(tasks)
			}
		},
	}
}
