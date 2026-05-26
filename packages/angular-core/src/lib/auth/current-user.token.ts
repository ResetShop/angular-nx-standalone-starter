import { InjectionToken, type Signal } from '@angular/core'

/**
 * Minimal contract for a "currently authenticated user" source.
 *
 * Any signal-bearing store that exposes a `currentUser` signal whose value
 * has a numeric `id` satisfies this interface. Apps register their concrete
 * auth store under `CURRENT_USER_SOURCE` to make the `CurrentUser` service
 * resolve.
 *
 * Kept intentionally minimal (only `id` is required) so the contract does
 * not couple `packages/angular-core` to any specific user-domain shape.
 */
export interface CurrentUserSource {
	readonly currentUser: Signal<{ id: number } | null>
}

/**
 * DI token an app's auth store binds to (via `useExisting`) so the `CurrentUser`
 * service can read the current user without compile-time knowledge of the store.
 */
export const CURRENT_USER_SOURCE = new InjectionToken<CurrentUserSource>('CURRENT_USER_SOURCE')
