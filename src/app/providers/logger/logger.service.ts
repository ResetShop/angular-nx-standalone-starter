import { Injectable } from '@angular/core'

/**
 * Structured logger for Angular frontend services and stores.
 * Wraps console methods with [context] prefix for searchability.
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
	public error(context: string, message: string, err?: unknown): void {
		if (err !== undefined) {
			console.error(`[${context}] ${message}`, err)
		} else {
			console.error(`[${context}] ${message}`)
		}
	}

	public warn(context: string, message: string): void {
		console.warn(`[${context}] ${message}`)
	}
}
