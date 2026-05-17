// drizzle.config.ts
//
// Drizzle Kit loads this file with its own loader, outside the app's TypeScript
// project. It cannot use the `@config/env` path alias (which is scoped to
// `apps/reference-app/tsconfig.json`), so reading `process.env` directly here
// is the documented exception to the no-process-env policy. The app-level env
// schema in `apps/reference-app/src/api/config/env.ts` remains the source of
// truth — this file just forwards the same `PG_CONNECTION_STRING` to drizzle-kit.
//
// See docs/environment-variables.md for the supported delivery options.
import { defineConfig } from 'drizzle-kit'

const connectionString = process.env['PG_CONNECTION_STRING']
if (!connectionString) {
	throw new Error(
		'PG_CONNECTION_STRING is required for drizzle-kit. ' +
			'See docs/environment-variables.md for the supported delivery options.',
	)
}

export default defineConfig({
	// TODO: Manage to define dialect programmatically via config when setting up the repo
	// dialect: 'mysql',
	dialect: 'postgresql',
	schema: './apps/reference-app/src/db/schema',
	dbCredentials: {
		url: connectionString,
	},
})
