// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';
import { environment } from './src/api/helpers/environment';
export default defineConfig({
	// TODO: Manage to define dialect programmatically via config when setting up the repo
	// dialect: 'mysql',
	dialect: 'postgresql',
	schema: './src/db/schema',
	dbCredentials: {
		// TODO: Manage to define dbCredentials programmatically via config when setting up the repo
		// url: environment.database.mysql.connectionString,
		url: environment.database.pg.connectionString,
	},
});
