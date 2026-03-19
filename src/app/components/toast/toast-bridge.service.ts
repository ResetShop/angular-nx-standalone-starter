import { effect, inject, Injectable } from '@angular/core'
import { UIStore } from '@store/ui/ui.store'
import { DEFAULT_NOTIFICATION_DURATION } from '@store/ui/ui.types'
import { parseDurationToMs } from '@utils/duration'
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
 * Provided at the Dashboard route level in `dashboard.routes.ts` alongside
 * `provideToastConfig()`. Injected in `Dashboard` to activate the effect.
 */
@Injectable({ providedIn: 'root' })
export class ToastBridgeService {
	private readonly uiStore = inject(UIStore)
	private readonly toastManager = inject(NgpToastManager)
	private readonly activeToasts = new Map<string, NgpToastRef>()

	constructor() {
		effect(() => {
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
}
