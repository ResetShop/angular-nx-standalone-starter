import { effect, inject, Injectable } from '@angular/core'
import { parseDurationToMs } from '@resetshop/util'
import { DEFAULT_NOTIFICATION_DURATION } from '@store/ui/ui.constants'
import { UIStore } from '@store/ui/ui.store'
import type { NgpToastRef } from 'ng-primitives/toast'
import { NgpToastManager } from 'ng-primitives/toast'
import { ToastNotification } from './toast-notification'

/**
 * Bridges UIStore notification state to the ng-primitives toast system.
 *
 * Watches `UIStore.notifications()` via `effect()` and diffs against a local
 * map of active toasts. New notifications trigger `NgpToastManager.show()`,
 * removed notifications trigger `ref.dismiss()`.
 *
 * Because it watches the shared, global `UIStore.notifications()`, there must be
 * exactly ONE live instance — otherwise every instance renders every notification
 * (the #471 duplicate-toast root cause). It is a `providedIn: 'root'` singleton and must
 * NEVER be listed as a class in any route's `providers` (that mints a route-scoped
 * instance and resurrects the duplicate). Routes that fire toasts opt in via
 * `provideToast()`, which only `provideEnvironmentInitializer(() => inject(this))` — i.e.
 * it eagerly instantiates the single root instance so the `effect()` is live, without
 * creating a new one. `NgpToastManager` is likewise a root singleton (it renders into
 * `document.body`, so its provision location is irrelevant). No `NgpToastConfig` is
 * provided anywhere — this bridge passes its presentation options per `show()` (see below),
 * so there is no app-wide toast config to leak onto routes that never show toasts.
 */
@Injectable({ providedIn: 'root' })
export class ToastBridgeService {
	private readonly uiStore = inject(UIStore)
	private readonly toastManager = inject(NgpToastManager)
	private readonly activeToasts = new Map<string, NgpToastRef>()

	private readonly syncNotificationsEffect = effect(() => {
		const notifications = this.uiStore.notifications()
		const currentIds = new Set(notifications.map((n) => n.id))

		for (const notification of notifications) {
			if (!this.activeToasts.has(notification.id)) {
				// Presentation options are passed per-show, so no DI-provided NgpToastConfig has to live
				// anywhere globally (placement would otherwise default to 'top-end'). Container-level settings
				// not expressible per-show (maxToasts, gap, zIndex) use ng-primitives' defaults — maxToasts is
				// already 3, which matches this app's intent.
				const ref = this.toastManager.show(ToastNotification, {
					context: notification,
					placement: 'bottom-center',
					dismissible: true,
					duration: parseDurationToMs(notification.duration ?? DEFAULT_NOTIFICATION_DURATION),
				})
				this.activeToasts.set(notification.id, ref)
			}
		}

		for (const [id, ref] of this.activeToasts) {
			if (!currentIds.has(id)) {
				void ref.dismiss()
				this.activeToasts.delete(id)
			}
		}
	})
}
