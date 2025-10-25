export interface EnvironmentConfig {
	production: boolean;
	basePath: string;
	// TODO: Uncomment the Sanity Studio configuration if you're using Sanity Studio
	// sanity: {
	//   token: string;
	//   projectId: string;
	//   dataset: string;
	// };

	// TODO: Uncomment the Microsfot Clarity configuration if you're using Clarity analytics
	// clarity?: {
	//   projectId: string;
	//   token: string;
	// };

	// TODO: Uncomment the database configuration if you're using a database connection
	database: {
		pg?: {
			connectionString: string;
		};
		// mysql?: {
		//   connectionString: string;
		// };
	};
}

export const environment: EnvironmentConfig = {
	production: true,
	basePath: process.env['BASE_HREF'],

	// TODO: Uncomment the Sanity Studio configuration if you're using Sanity Studio
	// sanity: {
	//   projectId: process.env['SANITY_STUDIO_PROJECT_ID'] as string,
	//   dataset: process.env['SANITY_STUDIO_DATASET'] as string,
	//   token: process.env['SANITY_STUDIO_TOKEN'] as string,
	// },

	// TODO: Uncomment the Microsfot Clarity configuration if you're using Clarity analytics
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
};
