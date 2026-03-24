import type { LeafNavigationRoute } from '@interfaces/navigation'
import { featherUsers } from '@ng-icons/feather-icons'

export const usersNavigation: LeafNavigationRoute = {
	id: 'users',
	name: 'NAV.ADMIN.USERS',
	route: 'dashboard/users',
	icon: { featherUsers },
	permission: 'admin:users:read',
}
