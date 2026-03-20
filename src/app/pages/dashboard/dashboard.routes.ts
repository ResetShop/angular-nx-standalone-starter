import { provideToast } from '@components/toast/toast.provider'
import { Permission } from '@contracts/permission/permission.constants'
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
				data: { requiredPermission: Permission.USERS_READ },
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
						data: { requiredPermission: Permission.PERMISSIONS_READ },
						providers: [providePermissions(), PermissionsStore],
					},
					{
						path: 'roles',
						title: 'Roles',
						loadComponent: () => import('./roles/roles-list/roles-list'),
						canActivate: [permissionGuard],
						data: { requiredPermission: Permission.ROLES_READ },
						providers: [provideRoles(), providePermissions(), RolesStore, PermissionsStore, provideToast()],
					},
				],
			},
		],
	},
] satisfies NamedRoute[]
