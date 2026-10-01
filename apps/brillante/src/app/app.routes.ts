import { Route } from '@angular/router'
import { authGuard } from '@guards/auth.guard'
import { noAuthGuard } from '@guards/no-auth.guard'
import { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'

export const appRoutes: Route[] = [
	{
		path: '',
		title: '',
		pathMatch: 'full',
		redirectTo: 'dashboard',
	},
	{
		path: 'auth/login',
		title: 'SHELL.LOGIN.PAGE_TITLE',
		canActivate: [noAuthGuard],
		loadComponent: () => import('@pages/auth/login/login'),
	},
	{
		path: 'dashboard',
		title: 'DASHBOARD.BREADCRUMB',
		canActivate: [authGuard],
		loadChildren: () => import('./pages/dashboard/dashboard.routes'),
	},
	{
		path: 'account',
		title: 'ACCOUNT.TITLE',
		canActivate: [authGuard],
		loadChildren: () => import('./pages/account/account.routes'),
	},
	{
		path: '**',
		title: 'Wildcard',
		redirectTo: 'dashboard',
		pathMatch: 'full',
	},
] satisfies NamedRoute[]
