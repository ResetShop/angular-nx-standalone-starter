import { ChangeDetectionStrategy, Component, computed, effect, HostListener, inject } from '@angular/core'
import { Router } from '@angular/router'
import { Brand } from '@components/brand/brand'
import { Button } from '@components/button/button'
import NavSection from '@components/nav-section/nav-section'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherChevronsLeft, featherChevronsRight } from '@ng-icons/feather-icons'
import { Navigation } from '@providers/navigation/navigation'
import { NavigationState } from '@providers/navigation/navigation-state'
import { AuthStore } from '@store/auth/auth.store'
import { UIStore } from '@store/ui/ui.store'

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appSidebar]',
	host: {
		'[class.collapsed]': 'isCollapsed()',
		'[attr.data-collapsed]': 'isCollapsed() || null',
		'[attr.data-mobile-open]': 'uiStore.isSidebarOpen() || null',
	},
	imports: [Button, NavSection, Brand, NgIcon],
	providers: [NavigationState],
	viewProviders: [provideIcons({ featherChevronsLeft, featherChevronsRight })],
	template: `
		<div class="brand-container">
			@if (!isCollapsed()) {
				<app-brand />
			}
		</div>
		<div class="nav-container">
			@for (section of sections(); track section.id; let first = $first) {
				@if (isCollapsed() && !first) {
					<hr class="border-border" />
				}
				<app-nav-section [section]="section" [collapsed]="isCollapsed()" [class.px-2]="!isCollapsed()" />
			}
		</div>
		<div class="footer">
			@if (!isCollapsed()) {
				<button (click)="logout()" appButton variant="link">Cerrar sesión</button>
			}
			<button
				(click)="toggleCollapse()"
				[attr.aria-label]="isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
				class="me-2"
				appButton
				variant="ghost"
				size="icon"
			>
				<ng-icon
					[name]="isCollapsed() ? 'featherChevronsRight' : 'featherChevronsLeft'"
					[size]="isCollapsed() ? '24' : '20'"
				/>
			</button>
		</div>
	`,
	styles: `
		@reference "#tailwind-theme";

		:host {
			@apply grid h-svh min-w-0 grid-rows-[64px_1fr_64px] transition-[width] duration-200;

			.brand-container {
				@apply p-2;
			}

			.nav-container {
				@apply flex flex-col gap-2 overflow-y-auto;
			}

			.footer {
				@apply border-border flex items-center justify-between border-t;
			}
		}

		:host(.collapsed) {
			.brand-container {
				@apply border-border border-b;
			}

			.nav-container {
				@apply py-2;
			}

			.footer {
				@apply flex justify-center px-2;
			}
		}

		@media (max-width: 1023px) {
			:host {
				position: fixed;
				left: 0;
				top: 0;
				bottom: 0;
				width: var(--sidebar-width-mobile, 280px);
				z-index: 50;
				transform: translateX(-100%);
				transition: transform 200ms ease;
			}

			:host[data-mobile-open] {
				transform: translateX(0);
			}
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
	private readonly authStore = inject(AuthStore)
	private readonly navigation = inject(Navigation)
	private readonly router = inject(Router)
	protected readonly uiStore = inject(UIStore)
	protected readonly sections = computed(() => this.navigation.sections())
	protected readonly isCollapsed = this.uiStore.isSidebarCollapsed

	constructor() {
		effect(() => {
			const user = this.authStore.currentUser()
			const isLoggingOut = this.authStore.isLoggingOut()

			if (!user && !isLoggingOut) {
				this.router.navigate(['/auth/login'])
			}
		})
	}

	@HostListener('document:keydown.control.b', ['$event'])
	@HostListener('document:keydown.meta.b', ['$event'])
	protected onCollapseShortcut(event: Event): void {
		event.preventDefault()
		this.toggleCollapse()
	}

	@HostListener('document:keydown.escape')
	protected onEscape(): void {
		if (this.uiStore.isSidebarOpen()) {
			this.uiStore.setSidebarOpen(false)
		}
	}

	protected toggleCollapse(): void {
		this.uiStore.setSidebarCollapsed(!this.isCollapsed())
	}

	protected logout(): void {
		this.authStore.logout()
	}
}
