import { PermissionId } from '@constants/permissions'
import type { NavigationConfig } from '@interfaces/navigation'
import { featherActivity, featherHome, featherShield, featherUsers } from '@ng-icons/feather-icons'

/**
 * Navigation configuration for the application.
 *
 * Routes can be either:
 * - LeafNavigationRoute: No children property (renders as link)
 * - ParentNavigationRoute: Has children array with at least 1 child (renders as expandable)
 *
 * @example Leaf route
 * { id: 'home', name: 'Home', route: '/home', icon: { featherHome } }
 *
 * @example Parent route (will cause TypeScript error if children is empty)
 * {
 *   id: 'settings',
 *   name: 'Settings',
 *   route: '/settings',
 *   children: [ // Must have at least 1 child
 *     { id: 'profile', name: 'Profile', route: '/settings/profile' }
 *   ]
 * }
 */
export const navigationConfig: NavigationConfig = {
	sections: [
		{
			id: 'settings',
			name: 'Ajustes y mantenimiento',
			routes: [
				{
					id: 'welcome',
					name: 'Configuración inicial',
					route: 'dashboard/welcome',
					icon: { featherHome },
				},
				{
					id: 'health',
					name: 'Salud',
					route: 'dashboard/health',
					icon: { featherActivity },
				},
			],
		},
		{
			id: 'admin',
			name: 'Administración',
			routes: [
				{
					id: 'users',
					name: 'Usuarios',
					route: 'dashboard/users',
					icon: { featherUsers },
					permission: PermissionId.USERS_READ,
				},
				{
					id: 'authorization',
					name: 'Autorización',
					route: 'dashboard/authorization/roles',
					icon: { featherShield },
					children: [
						{
							id: 'roles',
							name: 'Roles',
							route: 'dashboard/authorization/roles',
							permission: PermissionId.ROLES_READ,
						},
						{
							id: 'permissions',
							name: 'Permisos',
							route: 'dashboard/authorization/permissions',
							permission: PermissionId.PERMISSIONS_READ,
						},
					],
				},
			],
		},
	],
}
