export default [
	{
		path: 'login',
		loadComponent: () => import('@pages/auth/login/login'),
	},
	{
		path: 'reset-password',
		loadComponent: () => import('@pages/auth/reset-password/reset-password'),
	},
];
