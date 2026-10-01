import { provideToast } from '@components/toast/toast.provider'
import { provideCashConcept } from '@providers/cash-concept/cash-concept.provider'
import { providePaymentMethod } from '@providers/payment-method/payment-method.provider'
import type { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { provideCash } from './cash.provider'
import { CashStore } from './cash.store'

/**
 * Cash register section. Reading is guarded by the parent dashboard route; creating and editing
 * transactions happen in drawers opened from the dashboard, which gates them on the manage
 * permission. The APIs and the store are provided once here.
 */
export default [
	{
		path: '',
		title: '',
		providers: [provideCash(), provideCashConcept(), providePaymentMethod(), CashStore, provideToast()],
		children: [
			{
				path: '',
				title: 'CASH.PAGE.TITLE',
				pathMatch: 'full',
				loadComponent: () => import('./cash-dashboard/cash-dashboard'),
			},
		],
	},
] satisfies NamedRoute[]
