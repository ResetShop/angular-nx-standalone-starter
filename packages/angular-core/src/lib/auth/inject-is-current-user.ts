import { inject } from '@angular/core'
import { CURRENT_USER_SOURCE } from './current-user.token'

/**
 * Returns a function that checks whether a given entity is the currently
 * authenticated user.
 *
 * Reactive: reads `currentUser` as a signal at call time, so consumers wrapping
 * the call in `computed()` / `effect()` / template expressions re-evaluate
 * when the current user changes.
 *
 * Returns `false` when either the entity or the current user is `null` /
 * `undefined`.
 *
 * Use this function for programmatic + `@if`-template checks. For pure-template
 * declarative gating, prefer the `*ifNotCurrentUser` structural directive.
 *
 * @example
 *   protected readonly isCurrentUser = injectIsCurrentUser()
 *   // template: @if (!isCurrentUser(row)) { <button>Delete</button> }
 */
export function injectIsCurrentUser(): (entity: { id: number } | null | undefined) => boolean {
	const source = inject(CURRENT_USER_SOURCE)
	return (entity) => {
		if (entity == null) return false
		const current = source.currentUser()
		return current != null && current.id === entity.id
	}
}
