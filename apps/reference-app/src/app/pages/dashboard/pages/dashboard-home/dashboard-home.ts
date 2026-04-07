import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import type { TranslationKey } from '@resetshop/angular-core/i18n/translations.schema'
import { Navigation } from '@resetshop/angular-core/navigation/navigation'
import NavigationCard from '@resetshop/ui/navigation-card/navigation-card'

@Component({
	selector: 'app-dashboard-home',
	imports: [NavigationCard, TranslatePipe],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<div class="space-y-8">
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
