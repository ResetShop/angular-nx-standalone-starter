import { Route } from '@angular/router';

export const appRoutes: Route[] = [
	// TODO: Remove access to this route once the project setup is completed
	{
		path: 'welcome',
		loadComponent: () => import('./pages/welcome/welcome'),
	},
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
