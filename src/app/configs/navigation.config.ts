import { NavigationConfig } from '@interfaces/navigation';
import { featherActivity, featherHome } from '@ng-icons/feather-icons';

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
	],
};
