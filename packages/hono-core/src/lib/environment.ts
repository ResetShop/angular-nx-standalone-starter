/**
 * Documentation type that fork apps may use as the shape of their own env
 * contract. Intentionally environment-free — this package never reads
 * `process.env`. Apps own their env source (see `apps/reference-app/src/api/config/env.ts`
 * for the canonical pattern).
 */
export interface EnvironmentConfig {
	production: boolean
	basePath: string
	database: {
		pg?: {
			connectionString: string
		}
	}
}
