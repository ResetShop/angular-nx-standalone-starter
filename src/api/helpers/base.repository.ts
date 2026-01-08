import { type DrizzlePgConnector } from './drizzle-postgres-connector';

interface BaseRepositoryDeps {
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
