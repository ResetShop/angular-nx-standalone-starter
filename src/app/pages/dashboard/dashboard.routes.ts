import { provideToast } from '@components/toast/toast.provider'
import { permissionGuard } from '@guards/permission.guard'
import { NamedRoute } from '@interfaces/navigation'
import Dashboard from '@pages/dashboard/dashboard'
import { provideNavigation, provideNavigationConfig } from '@providers/navigation/navigation.provider'
import { providePermissions } from '@providers/permissions/permissions.provider'
import { provideRoles } from '@providers/roles/roles.provider'
import { provideUsers } from '@providers/users/users.provider'
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
				title: 'DASHBOARD.BREADCRUMB',
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
				title: 'NAV.SETTINGS.HEALTH',
				loadComponent: () => import('./pages/health/health'),
			},
			// TODO: Remove access to this route once the project setup is completed
			{
				path: 'welcome',
				title: 'NAV.HOME.WELCOME',
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
				title: 'NAV.ADMIN.AUTHORIZATION',
				children: [
					{
						path: '',
						title: 'NAV.ADMIN.AUTHORIZATION',
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
