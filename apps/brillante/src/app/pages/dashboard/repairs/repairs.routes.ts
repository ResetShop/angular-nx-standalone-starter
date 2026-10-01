import { provideToast } from '@components/toast/toast.provider'
import { Permission } from '@contracts/permission/permission.constants'
import { permissionGuard } from '@guards/permission.guard'
import { provideCustomer } from '@providers/customer/customer.provider'
import { providePaymentMethod } from '@providers/payment-method/payment-method.provider'
import { provideRepair } from '@providers/repair/repair.provider'
import type { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { RepairIntakeStore } from '@store/repair/repair-intake.store'
import { RepairStore } from '@store/repair/repair.store'

// The list, the intake form and the detail page share one RepairStore instance: the section's
// parent route owns it together with the API providers it depends on.
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
				path: 'new',
				title: 'REPAIRS.CREATE.TITLE',
				canActivate: [permissionGuard],
				data: { requiredPermission: Permission.REPAIRS_MANAGE },
				loadComponent: () => import('./repair-create/repair-create'),
			},
			{
				path: ':id',
				title: 'REPAIRS.DETAIL.TITLE',
				loadComponent: () => import('./repair-detail/repair-detail'),
			},
		],
	},
] satisfies NamedRoute[]
