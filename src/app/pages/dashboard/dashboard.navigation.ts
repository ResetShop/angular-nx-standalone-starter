import type { NavigationConfig } from '@interfaces/navigation'
import { featherActivity, featherHome } from '@ng-icons/feather-icons'
import { authorizationNavigation } from './authorization/authorization.navigation'
import { usersNavigation } from './users/users.navigation'

export const dashboardNavigationConfig: NavigationConfig = {
	sections: [
		{
			id: 'home',
			routes: [{ id: 'welcome', name: 'NAV.HOME.WELCOME', route: 'dashboard/welcome', icon: { featherHome } }],
		},
		{
			id: 'settings',
			name: 'NAV.SETTINGS.SECTION',
			routes: [{ id: 'health', name: 'NAV.SETTINGS.HEALTH', route: 'dashboard/health', icon: { featherActivity } }],
		},
		{ id: 'admin', name: 'NAV.ADMIN.SECTION', routes: [usersNavigation, authorizationNavigation] },
	],
}
