import { provideToast } from '@components/toast/toast.provider'
import { Permission } from '@contracts/permission/permission.constants'
import { officeBranchGuard } from '@guards/office-branch.guard'
import { permissionGuard } from '@guards/permission.guard'
import Dashboard from '@pages/dashboard/dashboard'
import { provideOfficeBranch } from '@providers/office-branch/office-branch.provider'
import { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { provideNavigation, provideNavigationConfig } from '@resetshop/angular-core/navigation/navigation.provider'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { dashboardNavigationConfig } from './dashboard.navigation'

export default [
	{
		path: '',
		title: '',
		component: Dashboard,
		// The office branch is dashboard-wide state: the sidebar shows it, the branch guard reads it
		// and the settings pages edit it, so one instance lives at the dashboard route.
		providers: [
			provideNavigation(),
			provideNavigationConfig(dashboardNavigationConfig),
			provideOfficeBranch(),
			OfficeBranchStore,
			provideToast(),
		],
		children: [
			{
				path: '',
				title: '',
				pathMatch: 'full',
				loadComponent: () => import('./pages/dashboard-home/dashboard-home'),
			},
			{
				path: 'clients',
				title: 'SHELL.NAV.CLIENTS',
				canActivate: [permissionGuard, officeBranchGuard],
				data: { requiredPermission: Permission.CLIENTS_READ },
				loadChildren: () => import('./clients/clients.routes'),
			},
			{
				path: 'repairs',
				title: 'SHELL.NAV.REPAIRS',
				canActivate: [permissionGuard, officeBranchGuard],
				data: { requiredPermission: Permission.REPAIRS_READ },
				loadChildren: () => import('./repairs/repairs.routes'),
			},
			{
				path: 'cash',
				title: 'SHELL.NAV.CASH',
				canActivate: [permissionGuard, officeBranchGuard],
				data: { requiredPermission: Permission.CASH_READ },
				loadChildren: () => import('./cash/cash.routes'),
			},
			{
				path: 'reports',
				title: 'SHELL.NAV.REPORTS',
				canActivate: [permissionGuard],
				data: { requiredPermission: Permission.REPORTS_CASH_READ },
				loadChildren: () => import('./reports/reports.routes'),
			},
			{
				path: 'settings',
				title: 'SETTINGS.TITLE',
				loadChildren: () => import('./settings/settings.routes'),
			},
		],
	},
] satisfies NamedRoute[]
