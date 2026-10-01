import { provideToast } from '@components/toast/toast.provider'
import { Permission } from '@contracts/permission/permission.constants'
import { permissionGuard } from '@guards/permission.guard'
import { provideCashConcept } from '@providers/cash-concept/cash-concept.provider'
import { provideCash } from '@providers/cash/cash.provider'
import { providePaymentMethod } from '@providers/payment-method/payment-method.provider'
import type { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { CashStore } from '@store/cash/cash.store'

/**
 * Cash register section. Reading is guarded by the parent dashboard route; creating and editing
 * transactions require the manage permission. The APIs and the store are provided once here, so
 * the dashboard, the create page and the edit page share one store instance.
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
			{
				path: 'new',
				title: 'CASH.FORM.CREATE_TITLE',
				canActivate: [permissionGuard],
				data: { requiredPermission: Permission.CASH_MANAGE },
				loadComponent: () => import('./cash-create/cash-create'),
			},
			{
				path: ':id/edit',
				title: 'CASH.FORM.EDIT_TITLE',
				canActivate: [permissionGuard],
				data: { requiredPermission: Permission.CASH_MANAGE },
				loadComponent: () => import('./cash-edit/cash-edit'),
			},
		],
	},
] satisfies NamedRoute[]
