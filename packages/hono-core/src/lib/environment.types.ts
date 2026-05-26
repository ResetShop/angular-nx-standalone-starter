/**
 * Shape of the per-app environment constant.
 *
 * Each app provides its own `environment.ts` (typically `apps/<slug>/src/api/environment.ts`)
 * exporting a `const environment: EnvironmentConfig`. Backend consumers import the constant
 * via a relative path; this package owns only the type so the contract stays uniform across
 * apps without coupling the package to any app's concrete env-var names.
 */
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
