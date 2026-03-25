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
				title: 'Dashboard',
				pathMatch: 'full',
				loadComponent: () => import('./pages/dashboard-home/dashboard-home'),
			},
			{
				path: 'settings',
				title: 'Settings',
				loadComponent: () => import('./pages/settings/settings'),
			},
			{
				path: 'health',
				title: 'Salud',
				loadComponent: () => import('./pages/health/health'),
			},
			// TODO: Remove access to this route once the project setup is completed
			{
				path: 'welcome',
				title: 'Configuración Inicial',
				loadComponent: () => import('./pages/welcome/welcome'),
			},
			{
				path: 'users',
				title: 'Usuarios',
				loadComponent: () => import('./users/users-list/users-list'),
				canActivate: [permissionGuard],
				data: { requiredPermission: 'admin:users:read' },
				providers: [provideUsers(), provideRoles(), UsersStore, RolesStore, provideToast()],
			},
			{
				path: 'authorization',
				title: 'Autorización',
				children: [
					{
						path: '',
						title: 'Autorización',
						pathMatch: 'full',
						loadComponent: () => import('./authorization/authorization-home'),
					},
					{
						path: 'permissions',
						title: 'Permisos',
						loadComponent: () => import('./permissions/permissions-list/permissions-list'),
						canActivate: [permissionGuard],
						data: { requiredPermission: 'admin:permissions:read' },
						providers: [providePermissions(), PermissionsStore],
					},
					{
						path: 'roles',
						title: 'Roles',
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
