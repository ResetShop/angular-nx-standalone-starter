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
		],
	},
];
