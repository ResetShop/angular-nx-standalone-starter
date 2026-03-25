import type { NavigationConfig } from '@interfaces/navigation'
import { featherActivity, featherHome, featherSettings } from '@ng-icons/feather-icons'
import { authorizationNavigation } from './authorization/authorization.navigation'
import { usersNavigation } from './users/users.navigation'

export const dashboardNavigationConfig: NavigationConfig = {
	sections: [
		{
			id: 'home',
			routes: [
				{ id: 'welcome', name: 'DASHBOARD.HOME.NAV', route: 'dashboard/welcome', icon: { featherHome } },
				{ id: 'settings', name: 'SETTINGS.NAV', route: 'dashboard/settings', icon: { featherSettings } },
			],
		},
		{
			id: 'settings',
			name: 'DASHBOARD.SECTIONS.SETTINGS',
			routes: [{ id: 'health', name: 'HEALTH.NAV', route: 'dashboard/health', icon: { featherActivity } }],
		},
		{ id: 'admin', name: 'DASHBOARD.SECTIONS.ADMIN', routes: [usersNavigation, authorizationNavigation] },
	],
}
