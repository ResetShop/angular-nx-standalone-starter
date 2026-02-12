import { RenderMode } from '@angular/ssr';
import { serverRoutes } from './app.routes.server';

describe('serverRoutes', () => {
	it('should have a single catch-all server route', () => {
		expect(serverRoutes).toEqual([{ path: '**', renderMode: RenderMode.Server }]);
	});

	it('should have exactly one route', () => {
		expect(serverRoutes).toHaveLength(1);
	});
});
