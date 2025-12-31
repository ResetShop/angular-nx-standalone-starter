import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@providers/auth/auth';

/**
 * Intercepts outgoing HTTP requests to attach Paseto access token
 * and include credentials (cookies) for all API requests
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(Auth);
	const currentUser = authService.currentUser();

	// For API requests, always include credentials to send cookies
	if (req.url.includes('/api/')) {
		// Clone request with credentials
		let authReq = req.clone({
			withCredentials: true, // Send cookies (HttpOnly refresh token)
		});

		// Attach access token to non-auth endpoints
		if (!req.url.includes('/api/auth/login') && currentUser?.token) {
			authReq = authReq.clone({
				setHeaders: {
					Authorization: `Bearer ${currentUser.token}`,
				},
			});
		}

		return next(authReq);
	}

	return next(req);
};
