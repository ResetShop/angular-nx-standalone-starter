import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { toObservable } from '@angular/core/rxjs-interop'
import { AuthStore } from '@store/auth/auth.store'
import { catchError, filter, switchMap, take, throwError } from 'rxjs'
import { environment } from '../environments/environment'

/**
 * Intercepts 401 errors and attempts to refresh token.
 * Implements a mutex pattern to prevent multiple concurrent refresh attempts.
 * Cookies are sent automatically — no Authorization header manipulation needed.
 *
 * Only the app's own backend is covered: the legacy API's 401s are handled by `legacyTokenInterceptor`.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
	if (req.url.startsWith(environment.apiUrl)) {
		return next(req)
	}

	const authStore = inject(AuthStore)
	const { pathname } = new URL(req.url, location.origin)

	// toObservable() requires an injection context (it uses effect() internally).
	// The catchError callback below runs asynchronously when an HTTP error arrives,
	// at which point the injection context is no longer active. Creating the
	// observable here — in the synchronous interceptor body — avoids NG0203.
	const isRefreshing$ = toObservable(authStore.isTokenRefreshing)

	return next(req).pipe(
		catchError((error: HttpErrorResponse) => {
			if (error.status !== 401) {
				return throwError(() => error)
			}

			// Refresh endpoint failed — session is dead, force logout.
			// Navigation to /auth/login is handled by the route guard's catchError.
			if (pathname.startsWith('/api/auth/refresh')) {
				authStore.logout()
				return throwError(() => error)
			}

			// Login returns 401 for invalid credentials — not a token expiry
			if (pathname.startsWith('/api/auth/login')) {
				return throwError(() => error)
			}

			// Logout is a public endpoint — never refresh on its behalf
			if (pathname.startsWith('/api/auth/logout')) {
				return throwError(() => error)
			}

			// If a refresh is already in progress, wait for it then retry
			if (authStore.isTokenRefreshing()) {
				return isRefreshing$.pipe(
					filter((refreshing) => !refreshing),
					take(1),
					switchMap(() => {
						// If user was logged out during refresh, fail immediately
						// instead of retrying (avoids cascading 401 retry storms)
						if (!authStore.isAuthenticated()) {
							return throwError(() => error)
						}
						return next(req)
					}),
				)
			}

			// Start a new refresh
			authStore.startTokenRefresh()

			// Only a failed refresh ends the session; an error from the retried request itself (a 403, 404 or 500)
			// belongs to the caller.
			return authStore.refreshToken().pipe(
				catchError((refreshError) => {
					authStore.failTokenRefresh()
					authStore.logout()
					return throwError(() => refreshError)
				}),
				switchMap(() => {
					authStore.completeTokenRefresh()
					return next(req)
				}),
			)
		}),
	)
}
