import type { NavigationInputConfig } from '@interfaces/navigation'
import { featherActivity, featherHome, featherShield, featherUsers } from '@ng-icons/feather-icons'

/**
 * Segment-based navigation configuration.
 *
 * Each route declares only its own `segment` — the resolver in `navigation.resolver.ts`
 * concatenates basePath + parent segments + own segment into full route paths at registration time.
 * This eliminates path duplication across parent/child routes.
 *
 * The resolver is called in `provideNavigation()` before the config reaches the injection token.
 *
 * @example Leaf route
 * { id: 'home', name: 'Home', segment: 'home', icon: { featherHome } }
 * // Resolves to: route = 'dashboard/home'
 *
 * @example Parent route with children
 * {
 *   id: 'auth', name: 'Authorization', segment: 'authorization',
 *   children: [
 *     { id: 'roles', name: 'Roles', segment: 'roles' }
 *   ]
 * }
 * // Parent resolves to first child: route = 'dashboard/authorization/roles'
 * // Child resolves to: route = 'dashboard/authorization/roles'
 */
export const navigationInputConfig: NavigationInputConfig = {
	sections: [
		{
			id: 'settings',
			name: 'Ajustes y mantenimiento',
			basePath: 'dashboard',
			routes: [
				{
					id: 'welcome',
					name: 'Configuración inicial',
					segment: 'welcome',
					icon: { featherHome },
				},
				{
					id: 'health',
					name: 'Salud',
					segment: 'health',
					icon: { featherActivity },
				},
			],
		},
		{
			id: 'admin',
			name: 'Administración',
			basePath: 'dashboard',
			routes: [
				{
					id: 'users',
					name: 'Usuarios',
					segment: 'users',
					icon: { featherUsers },
					permission: 'admin:users:read',
				},
				{
					id: 'authorization',
					name: 'Autorización',
					segment: 'authorization',
					icon: { featherShield },
					children: [
						{
							id: 'roles',
							name: 'Roles',
							segment: 'roles',
							permission: 'admin:roles:read',
						},
						{
							id: 'permissions',
							name: 'Permisos',
							segment: 'permissions',
							permission: 'admin:permissions:read',
						},
					],
				},
			],
		},
	],
}
