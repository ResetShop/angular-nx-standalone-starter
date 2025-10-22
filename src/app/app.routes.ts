import { Route } from '@angular/router';
import { NamedRoute } from '@interfaces/navigation';

export const appRoutes: Route[] = [
	{
		path: 'auth',
		title: 'Autenticación',
		loadChildren: () => import('./pages/auth.routes'),
	},
	{
		path: 'dashboard',
		title: 'Panel Principal',
		loadChildren: () => import('./pages/dashboard/dashboard.routes'),
	},
	{
		path: '**',
		title: 'Wildcard',
		redirectTo: 'auth/login',
		pathMatch: 'full',
	},
] satisfies NamedRoute[];
