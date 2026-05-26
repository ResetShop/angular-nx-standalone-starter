export interface EnvironmentConfig {
	production: boolean
	basePath: string
	// TODO: Uncomment the Sanity Studio configuration if you're using Sanity Studio
	// sanity: {
	//   token: string;
	//   projectId: string;
	//   dataset: string;
	// };

	// TODO: Uncomment the Microsoft Clarity configuration if you're using Clarity analytics
	// clarity?: {
	//   projectId: string;
	//   token: string;
	// };

	// TODO: Uncomment the database configuration if you're using a database connection
	database: {
		pg?: {
			connectionString: string
		}
		// mysql?: {
		//   connectionString: string;
		// };
	}
}
