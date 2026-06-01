// drizzle.config.ts
import { dbEnv } from '@config/db.env'
import { defineConfig } from 'drizzle-kit'

// The `drizzle:create-migrations` / `drizzle:push-migrations` scripts invoke drizzle-kit through
// `tsx --tsconfig apps/reference-app/tsconfig.json`, so the `@config/*` alias resolves when this
// config loads. Reading `dbEnv.PG_CONNECTION_STRING` (instead of process.env) makes the script fail
// fast at boot with the formatted FATAL message when PG_CONNECTION_STRING is missing. This file is
// not part of any Nx project's lint/typecheck target, so the alias import does not trip
// @nx/enforce-module-boundaries.
export default defineConfig({
	// TODO: Manage to define dialect programmatically via config when setting up the repo
	// dialect: 'mysql',
	dialect: 'postgresql',
	schema: './apps/reference-app/src/db/schema',
	dbCredentials: {
		// TODO: Manage to define dbCredentials programmatically via config when setting up the repo
		// url: dbEnv.MYSQL_CONNECTION_STRING,
		url: dbEnv.PG_CONNECTION_STRING,
	},
})
