import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, mergeApplicationConfig, REQUEST } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Server-side interceptor that forwards browser cookies to outgoing API requests.
 * During SSR, cookies from the original browser request must be explicitly forwarded
 * because HttpClient does not automatically include them.
 */
const ssrCookieInterceptor: HttpInterceptorFn = (req, next) => {
	const request = inject(REQUEST, { optional: true });

	if (request && req.url.includes('/api/')) {
		const cookies = request.headers.get('cookie');
		if (cookies) {
			return next(req.clone({ setHeaders: { Cookie: cookies } }));
		}
	}

	return next(req);
};

const serverConfig: ApplicationConfig = {
	providers: [
		provideServerRendering(withRoutes(serverRoutes)),
		provideHttpClient(withInterceptors([ssrCookieInterceptor])),
	],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
