import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@providers/auth/auth';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';

// Shared state for coordinating token refresh across requests
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

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
				return throwError(() => error);
			}

			// Don't retry if already on refresh endpoint
			if (req.url.includes('/api/auth/refresh')) {
				authService.logout();
				return throwError(() => error);
			}

			// If a refresh is already in progress, wait for it
			if (isRefreshing) {
				return refreshTokenSubject.pipe(
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
			isRefreshing = true;
			refreshTokenSubject.next(null);

			return authService.refreshToken().pipe(
				switchMap((newTokens) => {
					isRefreshing = false;
					refreshTokenSubject.next(newTokens.token);

					// Retry original request with new token
					const retryReq = req.clone({
						setHeaders: {
							Authorization: `Bearer ${newTokens.token}`,
						},
					});
					return next(retryReq);
				}),
				catchError((refreshError) => {
					isRefreshing = false;
					refreshTokenSubject.next(null);

					// Refresh failed - logout user
					authService.logout();
					return throwError(() => refreshError);
				}),
			);
		}),
	);
};
