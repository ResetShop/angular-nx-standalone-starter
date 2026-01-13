/**
 * Check if running in a serverless environment.
 * Used to adapt behavior for connection-pooled environments.
 *
 * @returns true if IS_SERVERLESS env var is 'true'
 */
export function isServerless(): boolean {
	return process.env['IS_SERVERLESS'] === 'true';
}
