import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Header } from '@components/header/header'
import { LoadingSpinnerComponent } from '@components/loading-spinner/loading-spinner.component'
import { Sidebar } from '@components/sidebar/sidebar'
import { UIStore } from '@store/ui/ui.store'

@Component({
	selector: 'app-dashboard',
	imports: [RouterOutlet, Sidebar, Header, LoadingSpinnerComponent],
	template: `
		<aside class="border-r-1 border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-black/90" appSidebar></aside>
		@if (uiStore.isSidebarOpen()) {
			<div
				(click)="uiStore.setSidebarOpen(false)"
				class="fixed inset-0 z-40 bg-black/50 lg:hidden"
				aria-hidden="true"
			></div>
		}
		<header class="border-b-1 border-gray-200 p-4 dark:border-white/10 dark:bg-black/95" appHeader></header>
		<main class="bg-white p-4 dark:bg-black/95">
			<router-outlet />
		</main>
		@if (uiStore.isGlobalLoading()) {
			<app-loading-spinner />
		}
	`,
	host: {
		'[style.--sidebar-col-width]':
			'uiStore.isSidebarCollapsed() ? "var(--sidebar-width-collapsed)" : "var(--sidebar-width)"',
	},
	styles: `
		main {
			overflow: auto;
		}

		:host {
			@reference "tailwindcss";
			--sidebar-width: 240px;
			--sidebar-width-collapsed: 48px;
			--sidebar-width-mobile: 280px;
			@apply grid h-svh;
			grid-template-columns: var(--sidebar-col-width) 1fr;
			grid-template-rows: 64px 1fr;
			grid-template-areas:
				'aside nav nav'
				'aside main main';
			transition: grid-template-columns 200ms ease;
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

		@media (max-width: 1023px) {
			:host {
				grid-template-columns: 1fr;
				grid-template-rows: 64px 1fr;
				grid-template-areas:
					'nav'
					'main';
			}
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Dashboard {
	protected readonly uiStore = inject(UIStore)
}
