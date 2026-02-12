import { RenderMode, ServerRoute } from '@angular/ssr';
import { appRoutes } from './app.routes';

const clientRoutes: ServerRoute[] = appRoutes
	.filter((route) => route.path && route.path !== '**' && route.canActivate?.length)
	.map((route) => ({ path: `${route.path}/**`, renderMode: RenderMode.Client }));

export const serverRoutes: ServerRoute[] = [...clientRoutes, { path: '**', renderMode: RenderMode.Server }];
