import { provideToast } from '@components/toast/toast.provider'
import { provideCustomer } from '@providers/customer/customer.provider'
import { providePaymentMethod } from '@providers/payment-method/payment-method.provider'
import type { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { RepairIntakeStore } from './repair-intake.store'
import { provideRepair } from './repair.provider'
import { RepairStore } from './repair.store'

// The list, the detail page and the create and edit drawers they open share one RepairStore
// instance: the section's parent route owns it together with the API providers it depends on.
export default [
	{
		path: '',
		title: 'SHELL.NAV.REPAIRS',
		providers: [
			provideRepair(),
			provideCustomer(),
			providePaymentMethod(),
			RepairStore,
			RepairIntakeStore,
			provideToast(),
		],
		children: [
			{
				path: '',
				title: 'REPAIRS.PAGE.TITLE',
				pathMatch: 'full',
				loadComponent: () => import('./repairs-list/repairs-list'),
			},
			{
				path: ':id',
				title: 'REPAIRS.DETAIL.TITLE',
				loadComponent: () => import('./repair-detail/repair-detail'),
			},
		],
	},
] satisfies NamedRoute[]
