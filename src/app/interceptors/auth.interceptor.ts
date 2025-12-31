import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@providers/auth/auth';

/**
 * Intercepts outgoing HTTP requests to attach Paseto access token
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(Auth);
	const currentUser = authService.currentUser();

	// Skip token attachment for auth endpoints
	if (req.url.includes('/api/auth/')) {
		return next(req);
	}

	// Attach token to all other API requests
	if (currentUser?.token) {
		const authReq = req.clone({
			setHeaders: {
				Authorization: `Bearer ${currentUser.token}`,
			},
		});
		return next(authReq);
	}

	return next(req);
};
