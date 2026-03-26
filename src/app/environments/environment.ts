/**
 * Application environment configuration.
 *
 * Values are injected at build time via the `define` option in project.json.
 * Each `__ENV_*__` placeholder is replaced by the Angular builder (esbuild)
 * with the string literal specified per build configuration.
 *
 * To change values: edit the `define` block in the corresponding configuration
 * within `project.json` (development, staging, production).
 */

export type EnvironmentType = 'development' | 'staging' | 'production'

export interface AppEnvironment {
	readonly environment: EnvironmentType
	readonly apiUrl: string
	readonly clarityProjectId: string
	readonly defaultLanguage: 'en' | 'es'
}

declare const __ENV_ENVIRONMENT__: EnvironmentType
declare const __ENV_API_URL__: string
declare const __ENV_CLARITY_PROJECT_ID__: string
declare const __ENV_DEFAULT_LANGUAGE__: 'en' | 'es'

export const environment: AppEnvironment = {
	environment: __ENV_ENVIRONMENT__,
	apiUrl: __ENV_API_URL__,
	clarityProjectId: __ENV_CLARITY_PROJECT_ID__,
	defaultLanguage: __ENV_DEFAULT_LANGUAGE__,
}
