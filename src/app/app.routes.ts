import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	{
		path: 'auth',
		loadChildren: () => import('./pages/auth.routes'),
	},
	{
		path: 'dashboard',
		loadChildren: () => import('./pages/dashboard/dashboard.routes'),
	},
	{
		path: '**',
		redirectTo: 'auth/login',
		pathMatch: 'full',
	},
];
