import { provideReport } from '@providers/report/report.provider'
import type { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { CashReportStore } from '@store/cash-report/cash-report.store'

/**
 * Reports area mounted at `dashboard/reports`. Reading reports is guarded by the dashboard route.
 * The report API and its store live once on the parent route so every report page shares them.
 */
export default [
	{
		path: '',
		title: '',
		providers: [provideReport(), CashReportStore],
		children: [
			{
				path: '',
				title: 'REPORTS.TITLE',
				pathMatch: 'full',
				loadComponent: () => import('./reports-home/reports-home'),
			},
			{
				path: 'cash-report',
				title: 'REPORTS.CASH.TITLE',
				loadComponent: () => import('./cash-report/cash-report'),
			},
		],
	},
] satisfies NamedRoute[]
