import type { EnvironmentProviders } from '@angular/core'
import { inject, makeEnvironmentProviders, provideEnvironmentInitializer } from '@angular/core'
import { DEFAULT_NOTIFICATION_DURATION } from '@store/ui/ui.constants'
import { parseDurationToMs } from '@utils/duration'
import { NgpToastManager, provideToastConfig } from 'ng-primitives/toast'
import { ToastBridgeService } from './toast-bridge.service'

/**
 * Provides the full toast infrastructure for a route: ng-primitives config,
 * toast manager, bridge service, and eager instantiation of the bridge.
 *
 * All three dependencies (`NgpToastConfig`, `NgpToastManager`, `ToastBridgeService`)
 * must live in the same injector so the manager resolves the config and the bridge
 * resolves the manager. Since `NgpToastManager` and `ToastBridgeService` are both
 * `providedIn: 'root'`, explicitly providing them here creates route-scoped instances
 * that see the co-located config.
 *
 * Call once in the `providers` array of each route that fires toast notifications.
 */
export function provideToast(): EnvironmentProviders {
	return makeEnvironmentProviders([
		...provideToastConfig({
			placement: 'bottom-center',
			duration: parseDurationToMs(DEFAULT_NOTIFICATION_DURATION),
			dismissible: true,
			maxToasts: 3,
			gap: 16,
			zIndex: 9999,
		}),
		NgpToastManager,
		ToastBridgeService,
		provideEnvironmentInitializer(() => inject(ToastBridgeService)),
	])
}
