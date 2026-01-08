import { type DrizzlePgConnector, drizzlePgConnector } from './drizzle-postgres-connector';

interface BaseRepositoryDeps {
	db: DrizzlePgConnector;
}

/**
 * Base repository class for all repositories.
 * Uses Awilix CLASSIC injection mode - dependencies are passed via destructured constructor params.
 */
export abstract class BaseRepository {
	protected db: DrizzlePgConnector;

	constructor({ db }: BaseRepositoryDeps = { db: drizzlePgConnector }) {
		this.db = db;
	}
}
