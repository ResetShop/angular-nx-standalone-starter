import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import type { TranslationKey } from '@resetshop/angular-core/i18n/translations.schema'
import { Navigation } from '@resetshop/angular-core/navigation/navigation'
import { Alert, AlertDescription, AlertTitle } from '@resetshop/ui/alert/alert'
import NavigationCard from '@resetshop/ui/navigation-card/navigation-card'
import { AuthStore } from '@store/auth/auth.store'

@Component({
	selector: 'app-dashboard-home',
	imports: [Alert, AlertDescription, AlertTitle, NavigationCard, TranslatePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-8">
			@if (hasNoModuleAccess()) {
				<!-- Default alert variant intentionally — binds role="status" (polite ARIA
				     live region) which fits an advisory "no module access" message. -->
				<div appAlert>
					<h3 appAlertTitle>{{ 'DASHBOARD.HOME.NO_ACCESS_TITLE' | translate }}</h3>
					<p appAlertDescription>{{ 'DASHBOARD.HOME.NO_ACCESS_MESSAGE' | translate }}</p>
				</div>
			}
			@for (section of navigation.sections(); track section.id) {
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
	private readonly translation = inject(Translation)
	private readonly authStore = inject(AuthStore)

	/**
	 * True when the current user holds zero permissions — they can reach the
	 * unguarded cards (Welcome / Settings / Health) but no admin module is
	 * accessible to them. Triggers an explanatory empty-state alert at the top
	 * of the page so the user knows to contact their administrator instead of
	 * staring at a near-empty dashboard.
	 */
	protected readonly hasNoModuleAccess = computed(() => this.authStore.userPermissions().length === 0)

	protected getDescription(routeId: string): string {
		const keyMap: Record<string, TranslationKey> = {
			welcome: 'DASHBOARD.HOME.DESCRIPTIONS.WELCOME',
			settings: 'DASHBOARD.HOME.DESCRIPTIONS.SETTINGS',
			health: 'DASHBOARD.HOME.DESCRIPTIONS.HEALTH',
			users: 'DASHBOARD.HOME.DESCRIPTIONS.USERS',
			authorization: 'DASHBOARD.HOME.DESCRIPTIONS.AUTHORIZATION',
		}
		const key = keyMap[routeId]
		return key ? this.translation.instant(key) : ''
	}
}
