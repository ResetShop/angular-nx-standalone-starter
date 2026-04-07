// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'
import { environment } from './packages/hono-core/src/lib/environment'
export default defineConfig({
	// TODO: Manage to define dialect programmatically via config when setting up the repo
	// dialect: 'mysql',
	dialect: 'postgresql',
	schema: './apps/reference-app/src/db/schema',
	dbCredentials: {
		// TODO: Manage to define dbCredentials programmatically via config when setting up the repo
		// url: environment.database.mysql.connectionString,
		url: environment.database.pg.connectionString,
	},
})
