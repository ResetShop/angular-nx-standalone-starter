import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
	it('should mark guarded routes as client-rendered', () => {
		const clientRoutes = serverRoutes.filter((route) => route.renderMode === RenderMode.Client);

		expect(clientRoutes).toContainEqual({ path: 'auth/**', renderMode: RenderMode.Client });
		expect(clientRoutes).toContainEqual({ path: 'dashboard/**', renderMode: RenderMode.Client });
	});

	it('should end with a catch-all server route', () => {
		const lastRoute = serverRoutes[serverRoutes.length - 1];

		expect(lastRoute).toEqual({ path: '**', renderMode: RenderMode.Server });
	});

	it('should not include wildcard as a client-rendered route', () => {
		const clientRoutes = serverRoutes.filter((route) => route.renderMode === RenderMode.Client);

		expect(clientRoutes.every((route) => route.path !== '**')).toBe(true);
	});
});
