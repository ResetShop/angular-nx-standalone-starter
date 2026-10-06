import { httpEnv } from '../config/http.env'

/**
 * The public origin of the app: the first entry of `CORS_ORIGIN` (a single origin or a comma-separated list),
 * without a trailing slash. Links in emails are built from it.
 */
export function appOrigin(): string {
	return httpEnv.CORS_ORIGIN.split(',')[0].trim().replace(/\/$/, '')
}

/** An absolute link to a page of the app, for example `buildAppUrl('/auth/login')`. */
export function buildAppUrl(path: string): string {
	return `${appOrigin()}${path}`
}
