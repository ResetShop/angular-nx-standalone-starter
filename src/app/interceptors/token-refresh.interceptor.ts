import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';

/**
 * Intercepts 401 errors and attempts to refresh token.
 * Implements a mutex pattern to prevent multiple concurrent refresh attempts.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			// Only handle 401 Unauthorized errors
			if (error.status !== 401) {
				return throwError(() => error);
			}

			// Don't retry if already on refresh endpoint
			if (req.url.includes('/api/auth/refresh')) {
				authStore.logout();
				router.navigate(['/auth/login']);
				return throwError(() => error);
			}

			// If a refresh is already in progress, wait for it
			if (authStore.isTokenRefreshing()) {
				return authStore.getPendingRefreshToken$().pipe(
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
			authStore.setTokenRefreshing(true);
			authStore.clearPendingRefreshToken();

			return authStore.refreshToken().pipe(
				switchMap((newTokens) => {
					authStore.setTokenRefreshing(false);

					// Retry original request with new token
					const retryReq = req.clone({
						setHeaders: {
							Authorization: `Bearer ${newTokens.token}`,
						},
					});
					return next(retryReq);
				}),
				catchError((refreshError) => {
					authStore.setTokenRefreshing(false);
					authStore.clearPendingRefreshToken();

					// Refresh failed - logout user
					authStore.logout();
					router.navigate(['/auth/login']);
					return throwError(() => refreshError);
				}),
			);
		}),
	);
};
