import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@providers/auth/auth';
import { catchError, switchMap, throwError } from 'rxjs';

/**
 * Intercepts 401 errors and attempts to refresh token
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(Auth);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			// Only handle 401 Unauthorized errors
			if (error.status !== 401) {
				return throwError(() => error);
			}

			// Don't retry if already on refresh endpoint
			if (req.url.includes('/api/auth/refresh')) {
				authService.logout();
				return throwError(() => error);
			}

			// Attempt token refresh (refresh token is in HttpOnly cookie)
			return authService.refreshToken().pipe(
				switchMap((newTokens) => {
					// Retry original request with new token
					const retryReq = req.clone({
						setHeaders: {
							Authorization: `Bearer ${newTokens.token}`,
						},
					});
					return next(retryReq);
				}),
				catchError((refreshError) => {
					// Refresh failed - logout user
					authService.logout();
					return throwError(() => refreshError);
				}),
			);
		}),
	);
};
