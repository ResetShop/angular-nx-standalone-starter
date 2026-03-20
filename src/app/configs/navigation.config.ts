import type { NavigationConfig } from '@interfaces/navigation'
import { featherActivity, featherHome, featherShield, featherUsers } from '@ng-icons/feather-icons'

export const navigationConfig: NavigationConfig = {
	sections: [
		{
			id: 'settings',
			name: 'Ajustes y mantenimiento',
			routes: [
				{
					id: 'welcome',
					name: 'Configuración inicial',
					route: 'dashboard/welcome',
					icon: { featherHome },
				},
				{
					id: 'health',
					name: 'Salud',
					route: 'dashboard/health',
					icon: { featherActivity },
				},
			],
		},
		{
			id: 'admin',
			name: 'Administración',
			routes: [
				{
					id: 'users',
					name: 'Usuarios',
					route: 'dashboard/users',
					icon: { featherUsers },
					permission: 'admin:users:read',
				},
				{
					id: 'authorization',
					name: 'Autorización',
					route: 'dashboard/authorization/roles',
					icon: { featherShield },
					children: [
						{
							id: 'roles',
							name: 'Roles',
							route: 'dashboard/authorization/roles',
							permission: 'admin:roles:read',
						},
						{
							id: 'permissions',
							name: 'Permisos',
							route: 'dashboard/authorization/permissions',
							permission: 'admin:permissions:read',
						},
					],
				},
			],
		},
	],
}
