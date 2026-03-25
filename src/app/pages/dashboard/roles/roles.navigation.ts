import type { LeafNavigationRoute } from '@interfaces/navigation'

export const rolesNavigation: LeafNavigationRoute = {
	id: 'roles',
	name: 'ROLES.PAGE.NAV',
	route: 'dashboard/authorization/roles',
	permission: 'admin:roles:read',
}
