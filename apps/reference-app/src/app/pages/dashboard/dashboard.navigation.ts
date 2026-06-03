import { featherActivity, featherSettings } from '@ng-icons/feather-icons'
import type { NavigationConfig } from '@resetshop/angular-core/interfaces/navigation'
import { authorizationNavigation } from './authorization/authorization.navigation'
import { usersNavigation } from './users/users.navigation'

export const dashboardNavigationConfig: NavigationConfig = {
	sections: [
		{
			id: 'home',
			routes: [{ id: 'settings', name: 'SETTINGS.NAV', route: 'dashboard/settings', icon: { featherSettings } }],
		},
		{
			id: 'settings',
			name: 'DASHBOARD.SECTIONS.SETTINGS',
			routes: [{ id: 'health', name: 'HEALTH.NAV', route: 'dashboard/health', icon: { featherActivity } }],
		},
		{ id: 'admin', name: 'DASHBOARD.SECTIONS.ADMIN', routes: [usersNavigation, authorizationNavigation] },
	],
}
