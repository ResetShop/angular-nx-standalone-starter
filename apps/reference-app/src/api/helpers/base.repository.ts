import { type DrizzlePgConnector } from './drizzle-postgres-connector'

/**
 * Dependencies required by BaseRepository and inherited by all child repositories.
 * Child repositories inherit this constructor signature automatically via TypeScript's
 * class inheritance - no need to define constructors in child classes.
 */
export interface BaseRepositoryDeps {
	db: DrizzlePgConnector
}

/**
 * Either the root drizzle handle or a transaction handle. Use this as the
 * parameter type for repository helpers that may be invoked both from inside
 * a `db.transaction(async (tx) => ...)` block and from outside one. Helpers
 * called from inside a transaction must receive the `tx` so their queries
 * run on the same connection — under PGlite (single in-memory connection)
 * routing through `this.db` instead of `tx` self-deadlocks.
 */
export type DbExecutor = DrizzlePgConnector | Parameters<Parameters<DrizzlePgConnector['transaction']>[0]>[0]

/**
 * Base repository class for all repositories.
 * Uses Awilix PROXY injection mode - dependencies are passed via destructured constructor params.
 */
export abstract class BaseRepository {
	protected db: DrizzlePgConnector

	constructor({ db }: BaseRepositoryDeps) {
		this.db = db
	}
}
