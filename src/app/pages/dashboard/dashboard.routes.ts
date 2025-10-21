import Dashboard from '@pages/dashboard/dashboard';

export default [
	{
		path: '',
		component: Dashboard,
		children: [
			{
				path: 'health',
				loadComponent: () => import('./pages/health/health'),
			},
			// TODO: Remove access to this route once the project setup is completed
			{
				path: 'welcome',
				loadComponent: () => import('./pages/welcome/welcome'),
			},
		],
	},
];
