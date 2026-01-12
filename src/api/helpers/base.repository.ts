import { type DrizzlePgConnector } from './drizzle-postgres-connector';

/**
 * Dependencies required by BaseRepository and inherited by all child repositories.
 * Child repositories inherit this constructor signature automatically via TypeScript's
 * class inheritance - no need to define constructors in child classes.
 */
export interface BaseRepositoryDeps {
	db: DrizzlePgConnector;
}

/**
 * Base repository class for all repositories.
 * Uses Awilix PROXY injection mode - dependencies are passed via destructured constructor params.
 */
export abstract class BaseRepository {
	protected db: DrizzlePgConnector;

	constructor({ db }: BaseRepositoryDeps) {
		this.db = db;
	}
}
