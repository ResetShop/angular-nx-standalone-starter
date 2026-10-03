import { Hono } from 'hono'
import { createApiApp } from './app'
import { container } from './container/container'
import {
	type DatabaseBindings,
	requestDatabaseMiddleware,
	requireConnectionString,
	withRequestDatabase,
} from './helpers/request-database'
import type { RateLimitBindings } from './middlewares/rate-limit.middleware'

/** Bindings declared in `wrangler.jsonc` that the API reads from `c.env`. */
type WorkerBindings = DatabaseBindings & RateLimitBindings

/** The slice of Cloudflare's scheduled-event controller this Worker uses. */
interface ScheduledEvent {
	readonly cron: string
	readonly scheduledTime: number
}

/** Minimal shape of Cloudflare's `ExecutionContext` that the Worker passes to its handlers. */
interface WorkerExecutionContext {
	waitUntil(promise: Promise<unknown>): void
}

/**
 * Cloudflare Worker entry point. `wrangler.jsonc` routes only `/api/*` here (`run_worker_first`);
 * every other path is served as a static asset with the SPA fallback.
 */
const app = new Hono<{ Bindings: WorkerBindings }>()
app.use('*', requestDatabaseMiddleware())
app.route('/', createApiApp())

/**
 * Cron Trigger handler: purges expired refresh tokens. Replaces the in-process timer a long-lived
 * server would use; `IS_SERVERLESS=true` selects the transaction-scoped advisory lock that is safe
 * behind Hyperdrive's transaction pooling.
 */
async function scheduled(
	event: ScheduledEvent,
	bindings: WorkerBindings,
	executionCtx: WorkerExecutionContext,
): Promise<void> {
	await withRequestDatabase(requireConnectionString(bindings), executionCtx, async () => {
		const result = await container.cradle.tokenMaintenanceService.cleanupExpiredTokens()
		console.log(`[Cron ${event.cron}] Token cleanup finished: ${JSON.stringify(result)}`)
	})
}

export default { fetch: app.fetch, scheduled }
