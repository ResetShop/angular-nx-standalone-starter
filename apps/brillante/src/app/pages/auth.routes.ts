import { NamedRoute } from '@resetshop/angular-core/interfaces/navigation'

export default [
	{
		path: 'login',
		title: 'AUTH.LOGIN.TITLE',
		loadComponent: () => import('@pages/auth/login/login'),
	},
	{
		path: 'reset-password/confirm',
		title: 'AUTH.RESET_PASSWORD_CONFIRM.TITLE',
		loadComponent: () => import('@pages/auth/reset-password-confirm/reset-password-confirm'),
	},
	{
		path: 'reset-password',
		title: 'AUTH.RESET_PASSWORD.TITLE',
		loadComponent: () => import('@pages/auth/reset-password/reset-password'),
	},
] satisfies NamedRoute[]
