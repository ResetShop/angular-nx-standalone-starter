import { NamedRoute } from '@interfaces/navigation'
import Dashboard from '@pages/dashboard/dashboard'
import { providePermissions } from '@providers/permissions/permissions.provider'
import { provideRoles } from '@providers/roles/roles.provider'
import { provideUsers } from '@providers/users/users.provider'
import { PermissionsStore } from '@store/permissions/permissions.store'
import { RolesStore } from '@store/roles/roles.store'
import { UsersStore } from '@store/users/users.store'
import { provideToastConfig } from 'ng-primitives/toast'

export default [
	{
		path: '',
		title: '',
		component: Dashboard,
		providers: [
			...provideToastConfig({
				placement: 'bottom-center',
				duration: 5000,
				dismissible: true,
				maxToasts: 3,
				gap: 16,
				zIndex: 9999,
			}),
		],
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
				providers: [provideUsers(), provideRoles(), UsersStore, RolesStore],
			},
			{
				path: 'authorization',
				title: 'Autorización',
				children: [
					{
						path: 'permissions',
						title: 'Permisos',
						loadComponent: () => import('./permissions/permissions-list/permissions-list'),
						providers: [providePermissions(), PermissionsStore],
					},
					{
						path: 'roles',
						title: 'Roles',
						loadComponent: () => import('./roles/roles-list/roles-list'),
						providers: [provideRoles(), providePermissions(), RolesStore, PermissionsStore],
					},
				],
			},
		],
	},
] satisfies NamedRoute[]
