import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercepts outgoing HTTP requests to include credentials (cookies)
 * for all API requests. Access token is sent as an HttpOnly cookie.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	try {
		const url = new URL(req.url, location.origin);
		if (url.pathname.startsWith('/api/')) {
			return next(req.clone({ withCredentials: true }));
		}
	} catch {
		// SSR: location unavailable, withCredentials is irrelevant on the server
	}

	return next(req);
};
