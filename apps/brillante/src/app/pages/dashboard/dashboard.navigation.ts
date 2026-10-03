import { Permission } from '@contracts/permission/legacy-permission.constants'
import {
	featherBarChart2,
	featherDollarSign,
	featherHome,
	featherSettings,
	featherTool,
	featherUsers,
} from '@ng-icons/feather-icons'
import type { NavigationConfig } from '@resetshop/angular-core/interfaces/navigation'

export const dashboardNavigationConfig: NavigationConfig = {
	sections: [
		{
			id: 'home',
			routes: [{ id: 'dashboard', name: 'SHELL.NAV.HOME', route: 'dashboard', icon: { featherHome } }],
		},
		{
			id: 'operations',
			name: 'SHELL.NAV.SECTIONS.OPERATIONS',
			routes: [
				{
					id: 'clients',
					name: 'SHELL.NAV.CLIENTS',
					route: 'dashboard/clients',
					icon: { featherUsers },
					permission: Permission.CLIENTS_READ,
				},
				{
					id: 'repairs',
					name: 'SHELL.NAV.REPAIRS',
					route: 'dashboard/repairs',
					icon: { featherTool },
					permission: Permission.REPAIRS_READ,
				},
				{
					id: 'cash',
					name: 'SHELL.NAV.CASH',
					route: 'dashboard/cash',
					icon: { featherDollarSign },
					permission: Permission.CASH_READ,
				},
			],
		},
		{
			id: 'management',
			name: 'SHELL.NAV.SECTIONS.MANAGEMENT',
			routes: [
				{
					id: 'reports',
					name: 'SHELL.NAV.REPORTS',
					route: 'dashboard/reports',
					icon: { featherBarChart2 },
					permission: Permission.REPORTS_CASH_READ,
				},
				{ id: 'settings', name: 'SHELL.NAV.SETTINGS', route: 'dashboard/settings', icon: { featherSettings } },
			],
		},
	],
}
