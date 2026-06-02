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
		// Toast infrastructure is provided ONCE here at the shell — a persistent ancestor of every
		// toast-firing child route AND the target of permission-deny redirects. Providing it per-child
		// (as before) spawned multiple route-scoped ToastBridgeService instances that each rendered the
		// shared UIStore notifications; on a denied deep-link of a parameterized route the denied route's
		// bridge and the redirect context's bridge both fired, producing a duplicate deny toast (#471).
		providers: [provideNavigation(), provideNavigationConfig(dashboardNavigationConfig), provideToast()],
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
				providers: [provideUsers(), provideRoles(), UsersStore, RolesStore],
			},
			{
				path: 'users/:id',
				title: 'USERS.DETAIL.TITLE',
				loadComponent: () => import('./users/user-detail-page/user-detail-page'),
				canActivate: [permissionGuard],
				data: { requiredPermission: 'admin:users:read' },
				providers: [provideUsers(), provideRoles(), UsersStore, RolesStore],
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
						providers: [provideRoles(), providePermissions(), RolesStore, PermissionsStore],
					},
				],
			},
		],
	},
] satisfies NamedRoute[]
