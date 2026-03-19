import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import {
	featherAlertTriangle,
	featherCheckCircle,
	featherInfo,
	featherX,
	featherXCircle,
} from '@ng-icons/feather-icons'
import { UIStore } from '@store/ui/ui.store'
import type { NotificationType, UINotification } from '@store/ui/ui.types'
import { injectToastContext, NgpToast, NgpToastManager } from 'ng-primitives/toast'

@Component({
	selector: 'app-toast-notification',
	hostDirectives: [NgpToast],
	imports: [NgIcon],
	providers: [provideIcons({ featherCheckCircle, featherXCircle, featherAlertTriangle, featherInfo, featherX })],
	template: `
		<ng-icon [name]="icon()" class="size-4 shrink-0" />
		<p class="toast-message">{{ notification.message }}</p>
		<button (click)="dismiss()" class="toast-dismiss" aria-label="Dismiss notification">
			<ng-icon name="featherX" class="size-3.5" />
		</button>
	`,
	host: {
		'[class]': 'hostClasses()',
		'animate.enter': 'toast-enter',
		'animate.leave': 'toast-leave',
	},
	styleUrl: './toast-notification.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastNotification {
	protected readonly notification = injectToastContext<UINotification>()
	private readonly uiStore = inject(UIStore)
	private readonly toast = inject(NgpToast)
	private readonly manager = inject(NgpToastManager)

	private readonly iconMap: Record<NotificationType, string> = {
		success: 'featherCheckCircle',
		error: 'featherXCircle',
		warning: 'featherAlertTriangle',
		info: 'featherInfo',
	}

	private readonly styleMap: Record<NotificationType, string> = {
		success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
		error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
		warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
		info: 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300',
	}

	protected readonly icon = computed(() => this.iconMap[this.notification.type])

	protected readonly hostClasses = computed(() => this.styleMap[this.notification.type])

	protected dismiss(): void {
		this.uiStore.dismissNotification(this.notification.id)
		void this.manager.dismiss(this.toast)
	}
}
