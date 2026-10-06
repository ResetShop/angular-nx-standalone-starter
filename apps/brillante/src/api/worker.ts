import { logger } from '@resetshop/util'
import { Hono } from 'hono'
import { createApiApp } from './app'
import { container } from './container/container'
import {
	type DatabaseBindings,
	type DeferrableContext,
	requestDatabaseMiddleware,
	requireConnectionString,
	withRequestDatabase,
} from './helpers/request-database'
import { type EmailBindings, requestEmailMiddleware } from './helpers/request-email'
import type { RateLimitBindings } from './middlewares/rate-limit.middleware'

/** Bindings declared in `wrangler.jsonc` that the API reads from `c.env`. */
type WorkerBindings = DatabaseBindings & RateLimitBindings & EmailBindings

/** The slice of Cloudflare's scheduled-event controller this Worker uses. */
interface ScheduledEvent {
	readonly cron: string
	readonly scheduledTime: number
}

/**
 * Cloudflare Worker entry point. `wrangler.jsonc` routes only `/api/*` here (`run_worker_first`);
 * every other path is served as a static asset with the SPA fallback.
 */
const app = new Hono<{ Bindings: WorkerBindings }>()
app.use('*', requestDatabaseMiddleware())
app.use('*', requestEmailMiddleware())
app.route('/', createApiApp())

/**
 * Cron Trigger handler: purges expired refresh tokens. Replaces the in-process timer a long-lived
 * server would use. Serverless mode takes a transaction-scoped advisory lock, because Hyperdrive's
 * transaction pooling cannot hold a session-level one; the purge is idempotent, so two overlapping
 * runs are harmless and the lock only avoids duplicated work.
 */
async function scheduled(
	event: ScheduledEvent,
	bindings: WorkerBindings,
	executionCtx: DeferrableContext,
): Promise<void> {
	await withRequestDatabase(requireConnectionString(bindings), executionCtx, async () => {
		const result = await container.cradle.tokenMaintenanceService.cleanupExpiredTokens()
		logger.info('Cron', `${event.cron}: token cleanup finished ${JSON.stringify(result)}`)
	})
}

export default { fetch: app.fetch, scheduled }
