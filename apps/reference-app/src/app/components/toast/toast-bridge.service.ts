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
 * (the #471 duplicate-toast root cause). It is therefore provided (and eagerly
 * instantiated via `provideEnvironmentInitializer`) once at the `dashboard` shell by
 * `provideToast()`, NOT per child route. `providedIn: 'root'` is kept only for
 * tree-shaking and as a safe fallback; `provideToast()` deliberately re-provides it to
 * create a single route-scoped instance co-located with its `NgpToastManager` — do not
 * remove that explicit provision.
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
				const ref = this.toastManager.show(ToastNotification, {
					context: notification,
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
