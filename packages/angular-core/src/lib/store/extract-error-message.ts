import { HttpErrorResponse } from '@angular/common/http'

/**
 * Extracts a user-facing error message from an HTTP error response.
 * Falls back to the provided default message when the API response
 * does not contain a string error field.
 *
 * Expects the API error shape: `{ error: string }` (matches the project's
 * `ErrorResponse` contract from `@contracts/common/error.types`).
 */
export function extractErrorMessage(err: unknown, fallback: string): string {
	if (err instanceof HttpErrorResponse && typeof err.error?.error === 'string') {
		return err.error.error
	}
	return fallback
}
