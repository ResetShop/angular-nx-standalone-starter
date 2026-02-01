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
					children: [
						{
							id: 'welcome-step1',
							name: 'Paso 1: Datos básicos',
							route: 'dashboard/welcome/step1',
						},
						{
							id: 'welcome-step2',
							name: 'Paso 2: Configuración',
							route: 'dashboard/welcome/step2',
						},
					],
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
