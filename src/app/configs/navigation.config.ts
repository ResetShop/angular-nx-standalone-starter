import type { NavigationConfig } from '@interfaces/navigation';
import { featherActivity, featherHome } from '@ng-icons/feather-icons';

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
	],
};
