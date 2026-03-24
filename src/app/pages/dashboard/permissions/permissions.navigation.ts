import type { LeafNavigationRoute } from '@interfaces/navigation'

export const permissionsNavigation: LeafNavigationRoute = {
	id: 'permissions',
	name: 'NAV.ADMIN.PERMISSIONS',
	route: 'dashboard/authorization/permissions',
	permission: 'admin:permissions:read',
}
