// drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

// drizzle-kit is a build tool that runs at the workspace root, outside any Nx project boundary.
// Importing from an Nx project here would violate @nx/enforce-module-boundaries; the config also
// only needs one env var, not the full app environment object. Read process.env directly.
export default defineConfig({
	// TODO: Manage to define dialect programmatically via config when setting up the repo
	// dialect: 'mysql',
	dialect: 'postgresql',
	schema: './apps/reference-app/src/db/schema',
	dbCredentials: {
		// TODO: Manage to define dbCredentials programmatically via config when setting up the repo
		// url: process.env['MYSQL_CONNECTION_STRING'] as string,
		// REASON: PG_CONNECTION_STRING is required at drizzle-kit invocation time; undefined indicates a misconfigured invocation.
		url: process.env['PG_CONNECTION_STRING'] as string,
	},
})
