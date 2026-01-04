import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@providers/auth/auth';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';

/**
 * Intercepts 401 errors and attempts to refresh token.
 * Implements a mutex pattern to prevent multiple concurrent refresh attempts.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
	const authService = inject(Auth);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			// Only handle 401 Unauthorized errors
			if (error.status !== 401) {
				return throwError(() => {
					return error;
				});
			}

			// Don't retry if already on refresh endpoint
			if (req.url.includes('/api/auth/refresh')) {
				authService.logout();
				return throwError(() => error);
			}

			// If a refresh is already in progress, wait for it
			if (authService.isTokenRefreshing()) {
				return authService.refreshTokenSubject.pipe(
					filter((token): token is string => token !== null),
					take(1),
					switchMap((token) => {
						const retryReq = req.clone({
							setHeaders: { Authorization: `Bearer ${token}` },
						});
						return next(retryReq);
					}),
				);
			}

			// Start a new refresh
			authService.isTokenRefreshing.set(true);
			authService.refreshTokenSubject.next(null);

			return authService.refreshToken().pipe(
				switchMap((newTokens) => {
					authService.isTokenRefreshing.set(false);
					authService.refreshTokenSubject.next(newTokens.token);

					// Retry original request with new token
					const retryReq = req.clone({
						setHeaders: {
							Authorization: `Bearer ${newTokens.token}`,
						},
					});
					return next(retryReq);
				}),
				catchError((refreshError) => {
					authService.isTokenRefreshing.set(false);
					authService.refreshTokenSubject.next(null);

					// Refresh failed - logout user
					authService.logout();
					return throwError(() => refreshError);
				}),
			);
		}),
	);
};
