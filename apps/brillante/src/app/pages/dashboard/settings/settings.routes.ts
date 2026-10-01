import { provideToast } from '@components/toast/toast.provider'
import { Permission } from '@contracts/permission/permission.constants'
import { permissionGuard } from '@guards/permission.guard'
import { provideCashConcept } from '@providers/cash-concept/cash-concept.provider'
import { provideUser } from '@providers/user/user.provider'
import type { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { CashConceptsStore } from '@store/cash-concepts/cash-concepts.store'
import { ManagedUsersStore } from '@store/managed-users/managed-users.store'

/**
 * Settings area mounted at `dashboard/settings`. Each section that talks to its own API is a
 * parent route owning its providers, so the pages below it share one store instance. None of the
 * sections is behind the office branch guard: users without an assigned branch are sent to the
 * branch selection page of this area.
 */
export default [
	{
		path: '',
		title: 'SETTINGS.TITLE',
		pathMatch: 'full',
		loadComponent: () => import('./settings-home/settings-home'),
	},
	{
		// Choosing the branch of this browser needs no permission and no API providers of its own:
		// the dashboard route owns the office branch API and store.
		path: 'office-branches',
		title: '',
		children: [
			{
				path: '',
				title: 'OFFICE_BRANCHES.TITLE',
				pathMatch: 'full',
				loadComponent: () => import('./office-branches/office-branches'),
			},
			{
				path: 'add',
				title: 'OFFICE_BRANCHES.ADD.TITLE',
				canActivate: [permissionGuard],
				data: { requiredPermission: Permission.SETTINGS_OFFICE_BRANCHES_MANAGE },
				loadComponent: () => import('./office-branches/add-office-branch/add-office-branch'),
			},
		],
	},
	{
		path: 'user-management',
		title: '',
		canActivate: [permissionGuard],
		data: { requiredPermission: Permission.SETTINGS_USERS_MANAGE },
		providers: [provideUser(), ManagedUsersStore, provideToast()],
		children: [
			{
				path: '',
				title: 'MANAGED_USERS.TITLE',
				pathMatch: 'full',
				loadComponent: () => import('./user-management/user-management'),
			},
		],
	},
	{
		path: 'concepts',
		title: '',
		canActivate: [permissionGuard],
		data: { requiredPermission: Permission.SETTINGS_CASH_CONCEPTS_MANAGE },
		providers: [provideCashConcept(), CashConceptsStore, provideToast()],
		children: [
			{
				path: '',
				title: 'CASH_CONCEPTS.TITLE',
				pathMatch: 'full',
				loadComponent: () => import('./concepts/concepts'),
			},
		],
	},
] satisfies NamedRoute[]
