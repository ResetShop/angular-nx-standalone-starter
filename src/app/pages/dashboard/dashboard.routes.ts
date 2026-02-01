import { NamedRoute } from '@interfaces/navigation';
import Dashboard from '@pages/dashboard/dashboard';

export default [
	{
		path: '',
		title: '',
		component: Dashboard,
		children: [
			{
				path: 'health',
				title: 'Salud',
				loadComponent: () => import('./pages/health/health'),
			},
			// TODO: Remove access to this route once the project setup is completed
			{
				path: 'welcome',
				title: 'Configuración Inicial',
				loadComponent: () => import('./pages/welcome/welcome'),
				children: [
					{
						path: 'step1',
						title: 'Paso 1: Datos básicos',
						loadComponent: () => import('./pages/welcome/step1'),
					},
					{
						path: 'step2',
						title: 'Paso 2: Configuración',
						loadComponent: () => import('./pages/welcome/step2'),
					},
				],
			},
		],
	},
] satisfies NamedRoute[];
