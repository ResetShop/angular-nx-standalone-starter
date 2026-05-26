import { Injectable, inject } from '@angular/core'
import { CURRENT_USER_SOURCE } from './current-user.token'

/**
 * Cross-app service for asking "is this entity the currently authenticated user?".
 *
 * Reads `currentUser` from the app's registered `CURRENT_USER_SOURCE` at call time,
 * so the result is reactive when the call is made inside a template expression,
 * a `computed()`, or an `effect()`.
 *
 * Apps wire their concrete auth store to `CURRENT_USER_SOURCE` (typically in
 * `provideAuth()`) and consume this service via standard `inject()`.
 *
 * @example
 *   protected readonly currentUser = inject(CurrentUser)
 *   // template: @if (!currentUser.is(row)) { <button>Delete</button> }
 */
@Injectable({ providedIn: 'root' })
export class CurrentUser {
	private readonly source = inject(CURRENT_USER_SOURCE)

	/**
	 * Returns `true` if `entity.id` matches the currently authenticated user's id.
	 * Returns `false` when either side is null/undefined — both arms render the
	 * "this is not me" branch, matching the "show on missing data" semantics.
	 */
	public is(entity: { id: number } | null | undefined): boolean {
		if (entity == null) return false
		const current = this.source.currentUser()
		return current != null && current.id === entity.id
	}
}
