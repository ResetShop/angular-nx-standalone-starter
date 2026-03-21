import type { LeafNavigationRoute } from '@interfaces/navigation'

export const permissionsNavigation: LeafNavigationRoute = {
	id: 'permissions',
	name: 'Permisos',
	route: 'dashboard/authorization/permissions',
	permission: 'admin:permissions:read',
}
