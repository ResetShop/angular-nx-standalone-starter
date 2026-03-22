/**
 * Structured logger for backend services.
 * Security events emit JSON with `_type: 'security_event'` for log aggregation.
 * Operational messages use `[context] message` prefix for searchability.
 */
export const logger = {
	info(context: string, message: string): void {
		console.log(`[${context}] ${message}`)
	},

	warn(context: string, message: string): void {
		console.warn(`[${context}] ${message}`)
	},

	error(context: string, message: string, err?: unknown): void {
		if (err !== undefined) {
			console.error(`[${context}] ${message}`, err)
		} else {
			console.error(`[${context}] ${message}`)
		}
	},

	security(event: string, payload?: Record<string, unknown>): void {
		console.log(
			JSON.stringify({
				_type: 'security_event',
				event,
				...payload,
				timestamp: new Date().toISOString(),
			}),
		)
	},
}
