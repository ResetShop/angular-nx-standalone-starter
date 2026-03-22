import { HttpErrorResponse } from '@angular/common/http'
import { computed, inject } from '@angular/core'
import { mapLoginResponseToUser, mapMeResponseToUser } from '@domain/auth/auth.mapper'
import type { IUser } from '@domain/user/user.interface'
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals'
import { rxMethod } from '@ngrx/signals/rxjs-interop'
import { AuthApi } from '@providers/auth/auth.interface'
import { Logger } from '@providers/logger/logger.token'
import { catchError, EMPTY, exhaustMap, map, pipe, switchMap, tap } from 'rxjs'
import { initialAuthState } from './auth.types'

/**
 * AuthStore - Signal Store for authentication state
 *
 * Manages authentication state using NgRx Signal Store.
 * Components inject this store directly for all auth operations.
 * Uses AuthApi for HTTP calls.
 *
 * Session validation is performed by the route guards on every navigation
 * via `validateSession()`. Works on both browser and server platforms —
 * cookies are forwarded by the SSR cookie interceptor on the server side.
 */
export const AuthStore = signalStore(
	{ providedIn: 'root' },
	withState(initialAuthState),
	withComputed((store) => ({
		isAuthenticated: computed(() => !!store.currentUser()),
		userPermissions: computed(() => store.currentUser()?.permissions ?? []),
		userRoles: computed(() => store.currentUser()?.roles ?? []),
	})),
	withMethods((store) => {
		const authApi = inject(AuthApi)
		const loggerService = inject(Logger)

		return {
			/**
			 * Login with email and password
			 *
			 * Initiates login flow and updates state with result.
			 * The server sets the access token cookie — no client-side storage needed.
			 */
			login: rxMethod<{ email: string; password: string }>(
				pipe(
					tap(() => patchState(store, { isLoggingIn: true, loginError: null, networkError: false })),
					switchMap((params) =>
						authApi.login(params).pipe(
							tap({
								next: (response) => {
									const user = mapLoginResponseToUser(response)
									patchState(store, {
										currentUser: user,
										mustChangePassword: response.mustChangePassword,
										isLoggingIn: false,
										isTokenRefreshing: false,
										loginError: null,
										networkError: false,
									})
								},
								error: (error: HttpErrorResponse) => {
									const isNetworkError = error.status === 0 || error.status >= 500
									patchState(store, {
										isLoggingIn: false,
										loginError: isNetworkError ? null : error.error,
										networkError: isNetworkError,
									})
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			/**
			 * Logout user - clear state and revoke tokens
			 *
			 * Uses exhaustMap to guarantee the revocation request completes —
			 * duplicate calls while one is in-flight are silently dropped.
			 * The server deletes the cookies. Navigation should be handled by the caller.
			 */
			logout: rxMethod<void>(
				pipe(
					tap(() => patchState(store, { currentUser: null, mustChangePassword: false, isLoggingOut: true })),
					exhaustMap(() =>
						authApi.logout().pipe(
							tap({
								next: () => patchState(store, { isLoggingOut: false }),
								error: (err) => {
									loggerService.error('AuthStore', 'Logout error', err)
									patchState(store, { isLoggingOut: false })
								},
							}),
							catchError(() => EMPTY),
						),
					),
				),
			),

			/**
			 * Refresh access token
			 *
			 * Called by the token refresh interceptor when a 401 response is received.
			 * The server sets the new cookies — no client-side token handling needed.
			 */
			refreshToken() {
				return authApi.refreshToken()
			},

			/**
			 * Start token refresh - sets refreshing flag
			 */
			startTokenRefresh() {
				patchState(store, { isTokenRefreshing: true })
			},

			/**
			 * Complete token refresh - clears refreshing flag
			 */
			completeTokenRefresh() {
				patchState(store, { isTokenRefreshing: false })
			},

			/**
			 * Handle token refresh failure - resets refresh state
			 */
			failTokenRefresh() {
				patchState(store, { isTokenRefreshing: false })
			},

			/**
			 * Validate the current session by calling GET /api/auth/me
			 *
			 * Calls getMe(), maps the response to IUser, and patches currentUser.
			 * Does NOT catch errors — the caller (e.g. authGuard) owns the
			 * redirect/error-handling decision.
			 */
			validateSession() {
				return authApi.getMe().pipe(
					map((response) => mapMeResponseToUser(response)),
					tap((user) => patchState(store, { currentUser: user })),
				)
			},

			/**
			 * Update current user
			 */
			updateCurrentUser(user: IUser) {
				patchState(store, { currentUser: user })
			},
		}
	}),
)
