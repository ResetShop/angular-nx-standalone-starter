import type { NavigationConfig } from '@interfaces/navigation'
import { featherActivity, featherHome } from '@ng-icons/feather-icons'
import { authorizationNavigation } from './authorization/authorization.navigation'
import { usersNavigation } from './users/users.navigation'

export const dashboardNavigationConfig: NavigationConfig = {
	sections: [
		{
			id: 'home',
			routes: [{ id: 'welcome', name: 'Configuración inicial', route: 'dashboard/welcome', icon: { featherHome } }],
		},
		{
			id: 'settings',
			name: 'Ajustes y mantenimiento',
			routes: [{ id: 'health', name: 'Salud', route: 'dashboard/health', icon: { featherActivity } }],
		},
		{ id: 'admin', name: 'Administración', routes: [usersNavigation, authorizationNavigation] },
	],
}
