import { Route } from '@angular/router'
import { authGuard } from '@guards/auth.guard'
import { noAuthGuard } from '@guards/no-auth.guard'
import { NamedRoute } from '@interfaces/navigation'

export const appRoutes: Route[] = [
	{
		path: 'auth',
		title: 'AUTH.LOGIN.TITLE',
		canActivate: [noAuthGuard],
		loadChildren: () => import('./pages/auth.routes'),
	},
	{
		path: 'dashboard',
		title: 'DASHBOARD.BREADCRUMB',
		canActivate: [authGuard],
		loadChildren: () => import('./pages/dashboard/dashboard.routes'),
	},
	{
		path: '**',
		title: 'Wildcard',
		redirectTo: 'auth/login',
		pathMatch: 'full',
	},
] satisfies NamedRoute[]
