import { HttpInterceptorFn } from '@angular/common/http';
import { inject, REQUEST } from '@angular/core';

/**
 * Server-side interceptor that forwards browser cookies to outgoing API requests.
 * During SSR, cookies from the original browser request must be explicitly forwarded
 * because HttpClient does not automatically include them.
 */
export const ssrCookieInterceptor: HttpInterceptorFn = (req, next) => {
	const request = inject(REQUEST, { optional: true });

	if (request && req.url.startsWith('/api/')) {
		const cookies = request.headers.get('cookie');
		if (cookies) {
			return next(req.clone({ setHeaders: { Cookie: cookies } }));
		}
	}

	return next(req);
};
