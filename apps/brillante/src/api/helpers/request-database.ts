import { logger, parseDurationToMs } from '@resetshop/util'
import type { Context, ExecutionContext, MiddlewareHandler } from 'hono'
import { AsyncLocalStorage } from 'node:async_hooks'
import { Client, type Pool } from 'pg'

/**
 * Subset of the Cloudflare Hyperdrive binding that carries the connection string for the current
 * request. Hyperdrive pools connections at the edge, so each request opens its own cheap client.
 */
export interface HyperdriveBinding {
	readonly connectionString: string
}

export interface DatabaseBindings {
	HYPERDRIVE?: HyperdriveBinding
}

/** The slice of Cloudflare's `ExecutionContext` this module needs. */
export type DeferrableContext = Pick<ExecutionContext, 'waitUntil'>

/** The part of a `pg.Client` the scope manages directly; the rest is forwarded untouched. */
export type DatabaseClient = Pick<Client, 'connect' | 'end' | 'on'>

/** Creates the client for one request or scheduled run. Replaceable so tests can observe it. */
export type DatabaseClientFactory = (connectionString: string) => DatabaseClient

/**
 * Hyperdrive pools connections at the edge, so opening one per request is cheap, but a stalled
 * connect or query must not hold the request (or the `waitUntil` task that closes it) forever.
 */
function createPgClient(connectionString: string): DatabaseClient {
	const connectTimeout = parseDurationToMs('10s')
	const queryTimeout = parseDurationToMs('25s')
	return new Client({ connectionString, connectionTimeoutMillis: connectTimeout, query_timeout: queryTimeout })
}

/**
 * A Postgres client owned by exactly one request (or one scheduled run). The connection is opened
 * lazily on the first query, so requests that never touch the database (API docs, rejected tokens)
 * do not pay for one.
 */
class RequestDatabaseScope {
	private connection: Promise<void> | null = null

	constructor(public readonly client: DatabaseClient) {
		// Without a listener, a connection that drops while idle (between queries, or while the closing
		// task waits for deferred work) is an uncaught exception instead of a failed query.
		client.on('error', (error: Error) => logger.warn('Database', `Request-scoped client error: ${error.message}`))
	}

	/** Starts connecting on first use. pg queues queries issued while the connection is opening. */
	public ensureConnected(): void {
		// A failed connection also rejects the queued queries, which is where callers observe it.
		this.connection ??= this.client.connect().then(
			() => undefined,
			() => undefined,
		)
	}

	public async close(): Promise<void> {
		if (this.connection === null) return
		await this.connection
		await this.client.end().catch(() => undefined)
	}
}

const scopeStorage = new AsyncLocalStorage<RequestDatabaseScope>()

/**
 * True on Cloudflare Workers. Workers expose `navigator.userAgent === 'Cloudflare-Workers'`, the
 * documented runtime check; Node, Vitest and CLI scripts do not.
 */
export function isCloudflareWorker(): boolean {
	const runtimeNavigator = (globalThis as { navigator?: { userAgent?: string } }).navigator
	return runtimeNavigator?.userAgent === 'Cloudflare-Workers'
}

/**
 * Returns a pool-shaped handle that forwards every call to the client of the request currently
 * being served.
 *
 * Workers forbid using a socket opened by one request from another request, so the DI container's
 * long-lived `db` cannot own a connection pool there: a pool reused by a second request hangs the
 * Worker. Instead `db` is built on this handle and resolves the client at query time.
 */
export function createRequestScopedPool(): Pool {
	const target = {}
	const forwardToRequestClient: ProxyHandler<object> = {
		get(_target, property) {
			const scope = scopeStorage.getStore()
			if (!scope) {
				throw new Error('No request-scoped database client: database access outside a request or scheduled run')
			}
			scope.ensureConnected()
			const value: unknown = Reflect.get(scope.client, property)
			return typeof value === 'function' ? value.bind(scope.client) : value
		},
	}
	// REASON: drizzle's node-postgres driver only calls `query` (and `connect`-less transaction
	// statements) on this handle; it is not a real Pool, but the connector type keeps `$client` as
	// `Pool` so repositories, tests and CLI scripts share one `db` type across runtimes.
	return new Proxy(target, forwardToRequestClient) as unknown as Pool
}

/** Tracks the work registered with `waitUntil` and exposes the platform's untracked `waitUntil`. */
interface DeferredWorkTracker {
	/** Resolves once every tracked task, including tasks those tasks register in turn, has settled. */
	allSettled(): Promise<void>
	/** The platform's own `waitUntil`: tasks registered through it are not tracked. */
	registerUntracked(task: Promise<unknown>): void
}

/**
 * Replaces `executionCtx.waitUntil` with a wrapper that remembers every task registered through it
 * (still forwarding each to the platform), so the database client can be closed only after all of
 * them have settled.
 */
function trackDeferredWork(executionCtx: DeferrableContext): DeferredWorkTracker {
	const tasks: Promise<unknown>[] = []
	const registerUntracked = executionCtx.waitUntil.bind(executionCtx)
	executionCtx.waitUntil = (task: Promise<unknown>) => {
		tasks.push(task)
		registerUntracked(task)
	}

	return {
		registerUntracked,
		async allSettled() {
			let settledCount = -1
			while (settledCount !== tasks.length) {
				settledCount = tasks.length
				await Promise.allSettled(tasks)
			}
		},
	}
}

/**
 * Runs `work` with a database client scoped to it, then closes the client after every task the work
 * handed to `executionCtx.waitUntil` has settled.
 *
 * Deferred post-response work (for example the forgot-password email dispatch) keeps querying after
 * the response is built, so closing the client when `work` returns would silently break it.
 */
export async function withRequestDatabase<T>(
	connectionString: string,
	executionCtx: DeferrableContext,
	work: () => Promise<T>,
	createClient: DatabaseClientFactory = createPgClient,
): Promise<T> {
	const scope = new RequestDatabaseScope(createClient(connectionString))
	const deferredWork = trackDeferredWork(executionCtx)

	try {
		return await scopeStorage.run(scope, work)
	} finally {
		// The closing task must not go through the tracking wrapper: it would wait on itself.
		deferredWork.registerUntracked(deferredWork.allSettled().then(() => scope.close()))
	}
}

export function requireConnectionString(bindings: DatabaseBindings | undefined): string {
	const connectionString = bindings?.HYPERDRIVE?.connectionString
	if (!connectionString) {
		throw new Error('The HYPERDRIVE binding is not configured; see wrangler.jsonc')
	}
	return connectionString
}

/** Middleware that gives every request its own database client. */
export function requestDatabaseMiddleware(): MiddlewareHandler<{ Bindings: DatabaseBindings }> {
	return (c: Context<{ Bindings: DatabaseBindings }>, next) =>
		withRequestDatabase(requireConnectionString(c.env), c.executionCtx, next)
}
