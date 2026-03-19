import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core'
import { Router } from '@angular/router'
import { Brand } from '@components/brand/brand'
import { Button } from '@components/button/button'
import NavSection from '@components/nav-section/nav-section'
import { Navigation } from '@providers/navigation/navigation'
import { NavigationState } from '@providers/navigation/navigation-state'
import { AuthStore } from '@store/auth/auth.store'

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appSidebar]',
	imports: [Button, NavSection, Brand],
	providers: [NavigationState],
	template: `
		<div class="p-2">
			<app-brand />
		</div>
		<div class="flex flex-col gap-2">
			@for (section of sections(); track section.id) {
				<app-nav-section [section]="section" class="px-2" />
			}
		</div>
		<div class="flex items-center justify-center border-gray-200">
			<button (click)="logout()" appButton variant="link">Cerrar sesión</button>
		</div>
	`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply grid h-svh grid-rows-[64px_1fr_64px];
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
	private readonly authStore = inject(AuthStore)
	private readonly navigation = inject(Navigation)
	private readonly router = inject(Router)
	protected readonly sections = computed(() => this.navigation.sections())

	// React to logout: navigate when user becomes null and logout is complete
	private readonly logoutNavigationEffect = effect(() => {
		const user = this.authStore.currentUser()
		const isLoggingOut = this.authStore.isLoggingOut()

		// Only navigate after logout completes (user is null and no longer logging out)
		if (!user && !isLoggingOut) {
			this.router.navigate(['/auth/login'])
		}
	})

	protected logout(): void {
		this.authStore.logout()
	}
}
