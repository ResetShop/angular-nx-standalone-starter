import { Injectable } from '@angular/core'

/**
 * Singleton service that generates unique IDs for Pagination component instances.
 *
 * Each Pagination component needs a unique ID for its select element to ensure
 * proper label association and avoid duplicate IDs in the DOM.
 */
@Injectable({ providedIn: 'root' })
export class PaginationTracker {
	private instanceCount = 0

	/** Generates a unique instance ID for the select element. */
	nextId(): number {
		return ++this.instanceCount
	}
}
