import type { LeafNavigationRoute } from '@interfaces/navigation'

export const rolesNavigation: LeafNavigationRoute = {
	id: 'roles',
	name: 'NAV.ADMIN.ROLES',
	route: 'dashboard/authorization/roles',
	permission: 'admin:roles:read',
}
