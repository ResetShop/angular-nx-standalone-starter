import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Intercepts outgoing HTTP requests to include credentials (cookies)
 * for all API requests. Access token is sent as an HttpOnly cookie.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	if (req.url.startsWith('/api/')) {
		return next(req.clone({ withCredentials: true }));
	}

	return next(req);
};
