import { drizzlePgConnector } from './drizzle-postgres-connector';

export abstract class BaseRepository {
	protected db = drizzlePgConnector;
}
