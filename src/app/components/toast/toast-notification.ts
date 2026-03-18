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
	styles: `
		@reference "tailwindcss";

		/* Base layout */
		:host {
			position: absolute;
			touch-action: none;
			box-sizing: border-box;
			display: inline-grid;
			grid-template-columns: auto 1fr auto;
			align-items: center;
			gap: 12px;
			width: 350px;
			height: fit-content;
			padding: 12px 16px;
			border-width: 1px;
			border-radius: 8px;
			opacity: 0;
			z-index: var(--ngp-toast-z-index);
			transform: var(--y);
			transition: all 0.4s cubic-bezier(0.215, 0.61, 0.355, 1);
			@apply shadow-lg;
		}

		.toast-message {
			@apply m-0 text-sm font-medium select-none;
		}

		.toast-dismiss {
			@apply cursor-pointer rounded-md border-none bg-transparent p-0.5 opacity-70 hover:opacity-100;
			color: inherit;
		}

		/* Horizontal positioning */
		:host[data-position-x='end'] {
			right: 0;
		}

		:host[data-position-x='start'] {
			left: 0;
		}

		/* Vertical positioning */
		:host[data-position-y='top'] {
			top: 0;
			--lift: 1;
			--lift-amount: calc(var(--lift) * var(--ngp-toast-gap));
			--y: translateY(-100%);
		}

		:host[data-position-y='bottom'] {
			bottom: 0;
			--lift: -1;
			--lift-amount: calc(var(--lift) * var(--ngp-toast-gap));
			--y: translateY(100%);
		}

		/* Enter/exit states */
		:host[data-enter] {
			opacity: 1;
			--y: translateY(0);
		}

		:host[data-exit] {
			opacity: 0;
			--y: translateY(calc(calc(var(--lift) * var(--ngp-toast-gap)) * -1));
		}

		/* Visibility (max toasts limit) */
		:host[data-visible='false'] {
			opacity: 0;
			pointer-events: none;
		}

		/* Stacking behavior */
		:host[data-expanded='true']::after {
			content: '';
			position: absolute;
			left: 0;
			height: calc(var(--ngp-toast-gap) + 1px);
			bottom: 100%;
			width: 100%;
		}

		:host[data-expanded='false'][data-front='false'] {
			--scale: var(--ngp-toasts-before) * 0.05 + 1;
			--y: translateY(calc(var(--lift-amount) * var(--ngp-toasts-before))) scale(calc(-1 * var(--scale)));
			height: var(--ngp-toast-front-height);
		}

		:host[data-expanded='true'] {
			--y: translateY(calc(var(--lift) * var(--ngp-toast-offset)));
			height: auto;
		}

		/* Swipe gestures */
		:host[data-swiping='true'] {
			transform: var(--y) translateY(var(--ngp-toast-swipe-amount-y, 0)) translateX(var(--ngp-toast-swipe-amount-x, 0));
			transition: none;
		}

		:host[data-swiping='true'][data-swipe-direction='left'] {
			opacity: calc(1 - clamp(0, ((-1 * var(--ngp-toast-swipe-x, 0px)) - 45) / 55, 1));
		}

		:host[data-swiping='true'][data-swipe-direction='right'] {
			opacity: calc(1 - clamp(0, (var(--ngp-toast-swipe-x, 0px) - 45) / 55, 1));
		}

		/* Truncate non-front collapsed toasts */
		:host[data-front='false'][data-expanded='false'] .toast-message {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		/* Enter/leave animations */
		:host.toast-enter {
			animation: toast-slide-in 400ms cubic-bezier(0.215, 0.61, 0.355, 1);
		}

		:host.toast-leave {
			opacity: 0;
			transform: translateY(100%);
			transition:
				opacity 400ms cubic-bezier(0.215, 0.61, 0.355, 1),
				transform 400ms cubic-bezier(0.215, 0.61, 0.355, 1);
		}

		@keyframes toast-slide-in {
			from {
				opacity: 0;
				transform: translateY(100%);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastNotification {
	protected readonly notification = injectToastContext<UINotification>()
	private readonly uiStore = inject(UIStore)
	private readonly toast = inject(NgpToast)
	private readonly manager = inject(NgpToastManager)

	protected readonly icon = computed(() => {
		const iconMap: Record<NotificationType, string> = {
			success: 'featherCheckCircle',
			error: 'featherXCircle',
			warning: 'featherAlertTriangle',
			info: 'featherInfo',
		}
		return iconMap[this.notification.type]
	})

	protected readonly hostClasses = computed(() => {
		const styleMap: Record<NotificationType, string> = {
			success:
				'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
			error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
			warning:
				'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300',
			info: 'border-neutral-200 bg-neutral-50 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300',
		}
		return styleMap[this.notification.type]
	})

	protected dismiss(): void {
		this.uiStore.dismissNotification(this.notification.id)
		void this.manager.dismiss(this.toast)
	}
}
