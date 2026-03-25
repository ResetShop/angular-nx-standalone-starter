import type { ParentNavigationRoute } from '@interfaces/navigation'
import { featherShield } from '@ng-icons/feather-icons'
import { permissionsNavigation } from '../permissions/permissions.navigation'
import { rolesNavigation } from '../roles/roles.navigation'

export const authorizationNavigation: ParentNavigationRoute = {
	id: 'authorization',
	name: 'DASHBOARD.AUTHORIZATION.NAV',
	route: 'dashboard/authorization/roles',
	icon: { featherShield },
	children: [rolesNavigation, permissionsNavigation],
}
