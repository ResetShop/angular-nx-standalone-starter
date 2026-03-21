import type { LeafNavigationRoute, NavigationConfig } from '@interfaces/navigation'
import { featherActivity, featherHome } from '@ng-icons/feather-icons'
import { authorizationNavigation } from './authorization/authorization.navigation'
import { usersNavigation } from './users/users.navigation'

const welcomeNavigation: LeafNavigationRoute = {
	id: 'welcome',
	name: 'Configuración inicial',
	route: 'dashboard/welcome',
	icon: { featherHome },
}

const healthNavigation: LeafNavigationRoute = {
	id: 'health',
	name: 'Salud',
	route: 'dashboard/health',
	icon: { featherActivity },
}

export const dashboardNavigationConfig: NavigationConfig = {
	sections: [
		{ id: 'home', routes: [welcomeNavigation] },
		{ id: 'settings', name: 'Ajustes y mantenimiento', routes: [healthNavigation] },
		{ id: 'admin', name: 'Administración', routes: [usersNavigation, authorizationNavigation] },
	],
}
