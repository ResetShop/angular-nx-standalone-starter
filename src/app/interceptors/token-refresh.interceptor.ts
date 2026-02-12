import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';

/**
 * Intercepts 401 errors and attempts to refresh token.
 * Implements a mutex pattern to prevent multiple concurrent refresh attempts.
 * Cookies are sent automatically — no Authorization header manipulation needed.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
	const authStore = inject(AuthStore);
	const router = inject(Router);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status !== 401) {
				return throwError(() => error);
			}

			// Don't retry if already on refresh endpoint
			if (req.url.includes('/api/auth/refresh')) {
				authStore.logout();
				router.navigate(['/auth/login']);
				return throwError(() => error);
			}

			// If a refresh is already in progress, wait for it then retry
			if (authStore.isTokenRefreshing()) {
				return toObservable(authStore.isTokenRefreshing).pipe(
					filter((refreshing) => !refreshing),
					take(1),
					switchMap(() => next(req.clone({ withCredentials: true }))),
				);
			}

			// Start a new refresh
			authStore.startTokenRefresh();

			return authStore.refreshToken().pipe(
				switchMap(() => {
					authStore.completeTokenRefresh();
					return next(req.clone({ withCredentials: true }));
				}),
				catchError((refreshError) => {
					authStore.failTokenRefresh();
					authStore.logout();
					router.navigate(['/auth/login']);
					return throwError(() => refreshError);
				}),
			);
		}),
	);
};
