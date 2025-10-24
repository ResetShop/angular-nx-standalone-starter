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
					route: 'welcome',
					icon: { featherHome: featherHome },
					children: [],
				},
				{
					id: 'health',
					name: 'Salud',
					route: 'health',
					icon: { featherActivity: featherActivity },
					children: [],
				},
			],
		},
	],
};
