import { provideToast } from '@components/toast/toast.provider'
import {
	ADMIN_PERMISSION_PERMISSIONS,
	ADMIN_ROLE_PERMISSIONS,
	ADMIN_USER_PERMISSIONS,
} from '@contracts/permission/permission.constants'
import { permissionGuard } from '@guards/permission.guard'
import { NamedRoute } from '@interfaces/navigation'
import Dashboard from '@pages/dashboard/dashboard'
import { providePermissions } from '@providers/permissions/permissions.provider'
import { provideRoles } from '@providers/roles/roles.provider'
import { provideUsers } from '@providers/users/users.provider'
import { PermissionsStore } from '@store/permissions/permissions.store'
import { RolesStore } from '@store/roles/roles.store'
import { UsersStore } from '@store/users/users.store'

export default [
	{
		path: '',
		title: '',
		component: Dashboard,
		children: [
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
				data: { requiredPermission: ADMIN_USER_PERMISSIONS.READ },
				providers: [provideUsers(), provideRoles(), UsersStore, RolesStore, provideToast()],
			},
			{
				path: 'authorization',
				title: 'Autorización',
				children: [
					{
						path: 'permissions',
						title: 'Permisos',
						loadComponent: () => import('./permissions/permissions-list/permissions-list'),
						canActivate: [permissionGuard],
						data: { requiredPermission: ADMIN_PERMISSION_PERMISSIONS.READ },
						providers: [providePermissions(), PermissionsStore],
					},
					{
						path: 'roles',
						title: 'Roles',
						loadComponent: () => import('./roles/roles-list/roles-list'),
						canActivate: [permissionGuard],
						data: { requiredPermission: ADMIN_ROLE_PERMISSIONS.READ },
						providers: [provideRoles(), providePermissions(), RolesStore, PermissionsStore, provideToast()],
					},
				],
			},
		],
	},
] satisfies NamedRoute[]
