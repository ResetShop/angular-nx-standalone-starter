import type { EnvironmentConfig } from '@resetshop/hono-core'

export const environment: EnvironmentConfig = {
	production: true,
	// REASON: BASE_HREF is a required deployment-time env var; undefined at runtime indicates a misconfigured deploy.
	basePath: process.env['BASE_HREF'] as string,

	// TODO: Uncomment the Sanity Studio configuration if you're using Sanity Studio
	// sanity: {
	//   projectId: process.env['SANITY_STUDIO_PROJECT_ID'] as string,
	//   dataset: process.env['SANITY_STUDIO_DATASET'] as string,
	//   token: process.env['SANITY_STUDIO_TOKEN'] as string,
	// },

	// TODO: Uncomment the Microsoft Clarity configuration if you're using Clarity analytics
	// clarity: {
	//   projectId: process.env['CLARITY_PROJECT_ID'] as string,
	//   token: process.env['CLARITY_TOKEN'] as string,
	// },

	// TODO: Uncomment the database configuration if you're using a database connection
	database: {
		pg: {
			connectionString: process.env['PG_CONNECTION_STRING'] as string,
		},
		// mysql: {
		//   connectionString: process.env['MYSQL_CONNECTION_STRING'] as string,
		// },
	},
}
