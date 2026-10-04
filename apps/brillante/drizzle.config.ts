import { dbEnv } from '@config/db.env'
import { defineConfig } from 'drizzle-kit'

// Invoked through the `drizzle:*:brillante` scripts, which run drizzle-kit via
// `tsx --tsconfig apps/brillante/tsconfig.json` so the `@config/*` alias resolves when this config
// loads. Reading `dbEnv.PG_CONNECTION_STRING` (instead of process.env) makes the script fail fast
// with the formatted FATAL message when the connection string is missing.
export default defineConfig({
	dialect: 'postgresql',
	schema: './apps/brillante/src/db/schema',
	out: './apps/brillante/drizzle',
	dbCredentials: {
		url: dbEnv.PG_CONNECTION_STRING,
	},
})
