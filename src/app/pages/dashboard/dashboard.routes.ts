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
			{
				path: 'users',
				title: 'Usuarios',
				loadComponent: () => import('./users/users-list/users-list'),
			},
			// TODO: Remove access to this route once the project setup is completed
			{
				path: 'welcome',
				title: 'Configuración Inicial',
				loadComponent: () => import('./pages/welcome/welcome'),
			},
		],
	},
] satisfies NamedRoute[];
