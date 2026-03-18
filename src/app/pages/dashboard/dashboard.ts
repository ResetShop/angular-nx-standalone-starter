import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Header } from '@components/header/header'
import { LoadingSpinnerComponent } from '@components/loading-spinner/loading-spinner.component'
import { Sidebar } from '@components/sidebar/sidebar'
import { ToastBridgeService } from '@components/toast/toast-bridge.service'
import { UIStore } from '@store/ui/ui.store'

@Component({
	selector: 'app-dashboard',
	imports: [RouterOutlet, Sidebar, Header, LoadingSpinnerComponent],
	template: `
		<aside class="border-r-1 border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-black/90" appSidebar></aside>
		<header class="border-b-1 border-gray-200 p-4 dark:border-white/10 dark:bg-black/95" appHeader></header>
		<main class="bg-white p-4 dark:bg-black/95">
			<router-outlet />
		</main>
		@if (uiStore.isGlobalLoading()) {
			<app-loading-spinner />
		}
	`,
	styles: `
		main {
			overflow: auto;
		}

		:host {
			@reference "tailwindcss";
			@apply grid h-svh;
			grid-template-columns: 240px 1fr;
			grid-template-rows: 64px 1fr;
			grid-template-areas:
				'aside nav nav'
				'aside main main';
		}

		main {
			grid-area: main;
		}

		aside {
			grid-area: aside;
		}

		nav {
			grid-area: nav;
		}

		article {
			grid-area: article;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dashboard {
	protected readonly uiStore = inject(UIStore)
	private readonly _toastBridge = inject(ToastBridgeService)
}
