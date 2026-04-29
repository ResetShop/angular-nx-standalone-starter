import { provideToast } from '@components/toast/toast.provider'
import { permissionGuard } from '@guards/permission.guard'
import Dashboard from '@pages/dashboard/dashboard'
import { providePermissions } from '@providers/permissions/permissions.provider'
import { provideRoles } from '@providers/roles/roles.provider'
import { provideUsers } from '@providers/users/users.provider'
import { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'
import { provideNavigation, provideNavigationConfig } from '@resetshop/angular-core/navigation/navigation.provider'
import { PermissionsStore } from '@store/permissions/permissions.store'
import { RolesStore } from '@store/roles/roles.store'
import { UsersStore } from '@store/users/users.store'
import { dashboardNavigationConfig } from './dashboard.navigation'

export default [
	{
		path: '',
		title: '',
		component: Dashboard,
		providers: [provideNavigation(), provideNavigationConfig(dashboardNavigationConfig)],
		children: [
			{
				path: '',
				title: '',
				pathMatch: 'full',
				loadComponent: () => import('./pages/dashboard-home/dashboard-home'),
			},
			{
				path: 'settings',
				title: 'SETTINGS.TITLE',
				loadComponent: () => import('./pages/settings/settings'),
			},
			{
				path: 'health',
				title: 'HEALTH.NAV',
				loadComponent: () => import('./pages/health/health'),
			},
			// TODO: Remove access to this route once the project setup is completed
			{
				path: 'welcome',
				title: 'DASHBOARD.HOME.NAV',
				loadComponent: () => import('./pages/welcome/welcome'),
			},
			{
				path: 'users',
				title: 'USERS.PAGE.TITLE',
				loadComponent: () => import('./users/users-list/users-list'),
				canActivate: [permissionGuard],
				data: { requiredPermission: 'admin:users:read' },
				providers: [provideUsers(), provideRoles(), UsersStore, RolesStore, provideToast()],
			},
			{
				path: 'authorization',
				title: 'DASHBOARD.AUTHORIZATION.NAV',
				children: [
					{
						path: '',
						title: 'DASHBOARD.AUTHORIZATION.NAV',
						pathMatch: 'full',
						loadComponent: () => import('./authorization/authorization-home'),
					},
					{
						path: 'permissions',
						title: 'PERMISSIONS.PAGE.TITLE',
						loadComponent: () => import('./permissions/permissions-list/permissions-list'),
						canActivate: [permissionGuard],
						data: { requiredPermission: 'admin:permissions:read' },
						providers: [providePermissions(), PermissionsStore],
					},
					{
						path: 'roles',
						title: 'ROLES.PAGE.TITLE',
						loadComponent: () => import('./roles/roles-list/roles-list'),
						canActivate: [permissionGuard],
						data: { requiredPermission: 'admin:roles:read' },
						providers: [provideRoles(), providePermissions(), RolesStore, PermissionsStore, provideToast()],
					},
				],
			},
		],
	},
] satisfies NamedRoute[]
