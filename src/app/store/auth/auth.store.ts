import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { mapLoginResponseToUser, mapMeResponseToUser } from '@domain/auth/auth.mapper';
import type { IUser } from '@domain/user/user.interface';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { AuthApiService } from '@providers/auth/auth';
import { catchError, EMPTY, of, pipe, switchMap, tap } from 'rxjs';
import { initialAuthState } from './auth.types';

/**
 * AuthStore - Signal Store for authentication state
 *
 * Manages authentication state using NgRx Signal Store.
 * Components inject this store directly for all auth operations.
 * Uses AuthApiService for HTTP calls.
 *
 * Initialization: Initialized via `APP_INITIALIZER` which calls `initialize()`
 * before the router evaluates any guards. This guarantees `isInitialized` is
 * `true` and guards can check auth state synchronously.
 * Works on both browser and server platforms — cookies are forwarded by the
 * SSR cookie interceptor on the server side.
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
		const authApi = inject(AuthApiService);

		return {
			/**
			 * Initialize auth state by calling getMe()
			 *
			 * Restores the user session from the HttpOnly access token cookie.
			 * On success, sets currentUser. On failure (401/network), sets currentUser to null.
			 * Always sets isInitialized to true when complete.
			 *
			 * Called by the auth APP_INITIALIZER to guarantee auth state is resolved
			 * before the router evaluates any guards.
			 */
			initialize() {
				return authApi.getMe().pipe(
					tap((response) => {
						const user = mapMeResponseToUser(response);
						patchState(store, { currentUser: user, isInitialized: true });
					}),
					catchError(() => {
						patchState(store, { currentUser: null, isInitialized: true });
						return of(undefined);
					}),
				);
			},

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
									const user = mapLoginResponseToUser(response);
									patchState(store, {
										currentUser: user,
										isLoggingIn: false,
										loginError: null,
										networkError: false,
									});
								},
								error: (error: HttpErrorResponse) => {
									const isNetworkError = error.status === 0 || error.status >= 500;
									patchState(store, {
										isLoggingIn: false,
										loginError: isNetworkError ? null : error.error,
										networkError: isNetworkError,
									});
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
			 * The server deletes the cookies. Navigation should be handled by the caller.
			 */
			logout() {
				patchState(store, { currentUser: null, isLoggingOut: true });

				authApi.logout().subscribe({
					complete: () => patchState(store, { isLoggingOut: false }),
					error: (error) => {
						// TODO(#66): Replace with security event logging — HIGH priority
						// Logout failures in a cookie-based auth flow may leave stale
						// server sessions, so visibility into these errors is critical.
						console.error('[AuthStore] Logout error:', error);
						patchState(store, { isLoggingOut: false });
					},
				});
			},

			/**
			 * Refresh access token
			 *
			 * Called by the token refresh interceptor when a 401 response is received.
			 * The server sets the new cookies — no client-side token handling needed.
			 */
			refreshToken() {
				return authApi.refreshToken();
			},

			/**
			 * Start token refresh - sets refreshing flag
			 */
			startTokenRefresh() {
				patchState(store, { isTokenRefreshing: true });
			},

			/**
			 * Complete token refresh - clears refreshing flag
			 */
			completeTokenRefresh() {
				patchState(store, { isTokenRefreshing: false });
			},

			/**
			 * Handle token refresh failure - resets refresh state
			 */
			failTokenRefresh() {
				patchState(store, { isTokenRefreshing: false });
			},

			/**
			 * Token introspection
			 */
			getMe() {
				return authApi.getMe();
			},

			/**
			 * Update current user
			 */
			updateCurrentUser(user: IUser) {
				patchState(store, { currentUser: user });
			},
		};
	}),
);
