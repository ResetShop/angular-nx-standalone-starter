import { featherActivity, featherHome, featherSettings, featherUser } from '@ng-icons/feather-icons'
import type { NavigationConfig } from '@resetshop/angular-core/interfaces/navigation'
import { authorizationNavigation } from './authorization/authorization.navigation'
import { usersNavigation } from './users/users.navigation'

export const dashboardNavigationConfig: NavigationConfig = {
	sections: [
		{
			id: 'home',
			routes: [{ id: 'dashboard', name: 'DASHBOARD.BREADCRUMB', route: 'dashboard', icon: { featherHome } }],
		},
		{
			id: 'settings',
			name: 'DASHBOARD.SECTIONS.SETTINGS',
			routes: [
				{ id: 'settings', name: 'SETTINGS.NAV', route: 'dashboard/settings', icon: { featherSettings } },
				{ id: 'health', name: 'HEALTH.NAV', route: 'dashboard/health', icon: { featherActivity } },
				// Temporary entry point to the account page until the header avatar menu provides one.
				{ id: 'account', name: 'ACCOUNT.NAV', route: 'account', icon: { featherUser } },
			],
		},
		{ id: 'admin', name: 'DASHBOARD.SECTIONS.ADMIN', routes: [usersNavigation, authorizationNavigation] },
	],
}
