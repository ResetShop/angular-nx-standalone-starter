import { Component } from '@angular/core'
import { PageShell } from '@components/page-shell/page-shell'
import { featherDollarSign } from '@ng-icons/feather-icons'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import NavigationCard from '@resetshop/ui/navigation-card/navigation-card'

/**
 * Entry point of the reports area: one card per available report.
 */
@Component({
	selector: 'app-reports-home',
	imports: [NavigationCard, PageShell, TranslatePipe],
	template: `
		<app-page-shell [title]="'REPORTS.TITLE' | translate" [loading]="false">
			<p pageDescription>{{ 'REPORTS.DESCRIPTION' | translate }}</p>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<app-navigation-card
					[route]="'/dashboard/reports/cash-report'"
					[name]="'REPORTS.HOME.CASH_TITLE' | translate"
					[description]="'REPORTS.HOME.CASH_DESCRIPTION' | translate"
					[icon]="cashIcon"
				/>
			</div>
		</app-page-shell>
	`,
})
export default class ReportsHome {
	protected readonly cashIcon = { featherDollarSign }
}
