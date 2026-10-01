import { Component, computed, inject } from '@angular/core'
import { AppTranslation } from '@providers/i18n/app-translation'
import type { AppTranslationKey } from '@providers/i18n/app-translations'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Navigation } from '@resetshop/angular-core/navigation/navigation'
import { Alert, AlertDescription, AlertTitle } from '@resetshop/ui/alert/alert'
import NavigationCard from '@resetshop/ui/navigation-card/navigation-card'
import { AuthStore } from '@store/auth/auth.store'

@Component({
	selector: 'app-dashboard-home',
	imports: [Alert, AlertDescription, AlertTitle, NavigationCard, TranslatePipe],
	template: `
		<div class="space-y-8">
			<header>
				<h1 class="text-foreground text-2xl font-bold">{{ welcome() }}</h1>
				<p class="text-muted-foreground mt-1 text-sm">{{ 'SHELL.HOME.DESCRIPTION' | translate }}</p>
			</header>
			@if (hasNoModuleAccess()) {
				<div appAlert>
					<h3 appAlertTitle>{{ 'SHELL.HOME.NO_ACCESS_TITLE' | translate }}</h3>
					<p appAlertDescription>{{ 'SHELL.HOME.NO_ACCESS_MESSAGE' | translate }}</p>
				</div>
			}
			@for (section of cardSections(); track section.id) {
				<section>
					@if (section.name) {
						<h2 class="text-foreground mb-4 text-lg font-semibold">{{ section.name | translate }}</h2>
					}
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						@for (route of section.routes; track route.id) {
							<app-navigation-card
								[route]="'/' + route.route"
								[name]="route.name | translate"
								[description]="getDescription(route.id)"
								[icon]="route.icon"
							/>
						}
					</div>
				</section>
			}
		</div>
	`,
})
export default class DashboardHome {
	protected readonly navigation = inject(Navigation)
	private readonly translation = inject(AppTranslation)
	private readonly authStore = inject(AuthStore)

	protected readonly welcome = computed(() =>
		this.translation
			.instant('SHELL.HOME.WELCOME')
			.replace('{name}', this.authStore.currentUser()?.firstName || this.authStore.currentUser()?.fullName || ''),
	)

	/**
	 * True when the signed-in user holds no permission at all (for example a customer account):
	 * every module card is hidden, so an explanatory alert tells them to contact an administrator.
	 */
	protected readonly hasNoModuleAccess = computed(() => this.authStore.userPermissions().length === 0)

	/**
	 * Navigation sections rendered as cards, without the self-referential link back to `/dashboard`.
	 * Sections left empty by that filter are dropped so no empty header renders.
	 */
	protected readonly cardSections = computed(() =>
		this.navigation
			.sections()
			.map((section) => ({ ...section, routes: section.routes.filter((route) => route.route !== 'dashboard') }))
			.filter((section) => section.routes.length > 0),
	)

	protected getDescription(routeId: string): string {
		const keyMap: Record<string, AppTranslationKey> = {
			clients: 'SHELL.HOME.CARDS.CLIENTS',
			repairs: 'SHELL.HOME.CARDS.REPAIRS',
			cash: 'SHELL.HOME.CARDS.CASH',
			reports: 'SHELL.HOME.CARDS.REPORTS',
			settings: 'SHELL.HOME.CARDS.SETTINGS',
		}
		const key = keyMap[routeId]
		return key ? this.translation.instant(key) : ''
	}
}
