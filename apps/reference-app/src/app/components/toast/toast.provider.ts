import type { EnvironmentProviders } from '@angular/core'
import { inject, makeEnvironmentProviders, provideEnvironmentInitializer } from '@angular/core'
import { ToastBridgeService } from './toast-bridge.service'

/**
 * Activates toast rendering for a route that fires toast notifications.
 *
 * `NgpToastManager` and `ToastBridgeService` are both `providedIn: 'root'` singletons
 * (the manager renders into `document.body`, so its provision location is irrelevant),
 * and the toast config (`provideToastConfig`) is registered once at the application
 * root (`app.config.ts`). This function therefore provisions **nothing new** — it only
 * eagerly `inject()`s the single root `ToastBridgeService` so its `effect()` is live for
 * this route. The injection resolves up to the one root instance (no route re-provides
 * it), so every route that calls this shares the same bridge and a notification renders
 * exactly once.
 *
 * Add it to the `providers` of each route that fires toasts — never list
 * `NgpToastManager`/`ToastBridgeService` as classes in a route's `providers` (that would
 * mint a route-scoped instance; multiple live instances each render every notification,
 * the #471 duplicate-toast bug). Routes that fire no toasts add nothing.
 */
export function provideToast(): EnvironmentProviders {
	return makeEnvironmentProviders([provideEnvironmentInitializer(() => inject(ToastBridgeService))])
}
