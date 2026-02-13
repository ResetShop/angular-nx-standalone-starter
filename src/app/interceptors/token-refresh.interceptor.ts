import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AuthStore } from '@store/auth/auth.store';
import { catchError, filter, switchMap, take, throwError } from 'rxjs';

/**
 * Intercepts 401 errors and attempts to refresh token.
 * Implements a mutex pattern to prevent multiple concurrent refresh attempts.
 * Cookies are sent automatically — no Authorization header manipulation needed.
 *
 * Disabled during SSR because:
 * - Token refresh sets new cookies via Set-Cookie headers on the API response,
 *   but those headers never reach the browser (they stay in the SSR HTTP client).
 * - Calling router.navigate() during SSR disrupts the render cycle.
 * - The browser handles refresh after hydration via the same interceptor.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
	const platformId = inject(PLATFORM_ID);

	// During SSR, skip refresh logic entirely — let errors propagate to callers.
	// The SSR cookie interceptor forwards cookies for the initial getMe() call.
	// If the access token is expired, the browser handles refresh after hydration.
	if (!isPlatformBrowser(platformId)) {
		return next(req);
	}

	const authStore = inject(AuthStore);
	const router = inject(Router);

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status !== 401) {
				return throwError(() => error);
			}

			// Auth endpoints where 401 is expected and should not trigger a refresh
			const skipRefreshRoutes = ['/api/auth/refresh', '/api/auth/login'];
			if (skipRefreshRoutes.some((route) => req.url.includes(route))) {
				if (req.url.includes('/api/auth/refresh')) {
					authStore.logout();
					router.navigate(['/auth/login']);
				}
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
