// drizzle.config.ts
//
// drizzle-kit is invoked through `tsx --tsconfig apps/reference-app/tsconfig.json`
// (see the `drizzle:create-migrations` / `drizzle:push-migrations` scripts in
// package.json), so the `@config/*` path alias resolves here and the db
// sub-schema is the single source of truth for the connection string.
//
// See docs/environment-variables.md for the supported delivery options.
import { dbEnv } from '@config/db.env'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
	// TODO: Manage to define dialect programmatically via config when setting up the repo
	// dialect: 'mysql',
	dialect: 'postgresql',
	schema: './apps/reference-app/src/db/schema',
	dbCredentials: {
		url: dbEnv.PG_CONNECTION_STRING,
	},
})
