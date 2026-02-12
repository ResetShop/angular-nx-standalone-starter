import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { authStorageDataSchema } from '@domain/auth/auth-storage.type';
import { mapLoginResponseToUser, mapStorageDataToUser, mapUserToStorageData } from '@domain/auth/auth.mapper';
import type { IUser } from '@domain/user/user.interface';
import { createUser } from '@domain/user/user.mapper';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { AuthApiService } from '@providers/auth/auth';
import { catchError, EMPTY, pipe, switchMap, tap } from 'rxjs';
import { initialAuthState } from './auth.types';

/**
 * AuthStore - Signal Store for authentication state
 *
 * Manages authentication state using NgRx Signal Store.
 * Components inject this store directly for all auth operations.
 * Uses AuthApiService for HTTP calls.
 *
 * @example
 * // Basic usage in a component
 * import { inject } from '@angular/core';
 * import { AuthStore } from '@store/auth/auth.store';
 *
 * export class MyComponent {
 *   private authStore = inject(AuthStore);
 *
 *   // Read signals in template or code
 *   isAuthenticated = this.authStore.isAuthenticated;
 *   currentUser = this.authStore.currentUser;
 *   userPermissions = this.authStore.userPermissions;
 * }
 *
 * @example
 * // Login flow with error handling
 * import { effect, inject, signal } from '@angular/core';
 * import { Router } from '@angular/router';
 * import { AuthStore } from '@store/auth/auth.store';
 *
 * export class LoginComponent {
 *   private authStore = inject(AuthStore);
 *   private router = inject(Router);
 *   readonly errorMessage = signal<string | null>(null);
 *
 *   constructor() {
 *     // React to login state changes
 *     effect(() => {
 *       const user = this.authStore.currentUser();
 *       const error = this.authStore.loginError();
 *
 *       if (user) {
 *         this.errorMessage.set(null);
 *         this.router.navigate(['/dashboard']);
 *       } else if (error) {
 *         this.errorMessage.set(error.message);
 *       }
 *     });
 *   }
 *
 *   onSubmit(email: string, password: string) {
 *     this.authStore.login({ email, password });
 *   }
 * }
 *
 * @example
 * // Logout flow with navigation
 * import { effect, inject } from '@angular/core';
 * import { Router } from '@angular/router';
 * import { AuthStore } from '@store/auth/auth.store';
 *
 * export class SidebarComponent {
 *   private authStore = inject(AuthStore);
 *   private router = inject(Router);
 *
 *   constructor() {
 *     // React to logout completion
 *     effect(() => {
 *       const user = this.authStore.currentUser();
 *       const isLoggingOut = this.authStore.isLoggingOut();
 *
 *       if (!user && !isLoggingOut) {
 *         this.router.navigate(['/auth/login']);
 *       }
 *     });
 *   }
 *
 *   logout() {
 *     this.authStore.logout();
 *   }
 * }
 *
 * @example
 * // Using in templates
 * // In component:
 * export class DashboardComponent {
 *   authStore = inject(AuthStore);
 * }
 *
 * // In template:
 * @if (authStore.isAuthenticated()) {
 *   <h1>Welcome {{ authStore.currentUser()?.firstName }}!</h1>
 *   <p>Roles: {{ authStore.userRoles().join(', ') }}</p>
 * }
 *
 * @example
 * // Permission checking
 * export class FeatureComponent {
 *   private authStore = inject(AuthStore);
 *
 *   canEdit = computed(() => {
 *     const user = this.authStore.currentUser();
 *     return user?.hasPermission('articles', 'update') ?? false;
 *   });
 * }
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
			 * Get observable stream of pending refresh token for interceptor coordination
			 *
			 * Used by token refresh interceptor to coordinate multiple concurrent requests
			 * that receive 401 errors during a token refresh operation.
			 *
			 * @example
			 * // In an HTTP interceptor
			 * if (authStore.isTokenRefreshing()) {
			 *   return authStore.getPendingRefreshToken$().pipe(
			 *     filter((token): token is string => token !== null),
			 *     take(1),
			 *     switchMap((token) => {
			 *       const retryReq = req.clone({
			 *         setHeaders: { Authorization: `Bearer ${token}` },
			 *       });
			 *       return next(retryReq);
			 *     }),
			 *   );
			 * }
			 */
			getPendingRefreshToken$() {
				return toObservable(store.pendingRefreshToken);
			},

			/**
			 * Login with email and password
			 *
			 * Initiates login flow and updates state with result.
			 * Watch loginError() and currentUser() signals to react to success/failure.
			 *
			 * @example
			 * // In a component
			 * onLoginSubmit() {
			 *   const email = this.loginForm.get('email')?.value;
			 *   const password = this.loginForm.get('password')?.value;
			 *   this.authStore.login({ email, password });
			 * }
			 */
			login: rxMethod<{ email: string; password: string }>(
				pipe(
					tap(() => patchState(store, { isLoggingIn: true, loginError: null, networkError: false })),
					switchMap((params) =>
						authApi.login(params).pipe(
							tap({
								next: (response) => {
									const user = mapLoginResponseToUser(response);
									const storageData = mapUserToStorageData(user);
									localStorage.setItem('auth_user', JSON.stringify(storageData));
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
			 * Note: Navigation should be handled by the caller (component/interceptor).
			 * Components can listen to currentUser() === null to trigger navigation.
			 *
			 * @example
			 * // In a component with navigation effect
			 * constructor() {
			 *   effect(() => {
			 *     const user = this.authStore.currentUser();
			 *     const isLoggingOut = this.authStore.isLoggingOut();
			 *
			 *     if (!user && !isLoggingOut) {
			 *       this.router.navigate(['/auth/login']);
			 *     }
			 *   });
			 * }
			 *
			 * logout() {
			 *   this.authStore.logout();
			 * }
			 */
			logout() {
				patchState(store, { currentUser: null, isLoggingOut: true });
				localStorage.removeItem('auth_user');

				authApi.logout().subscribe({
					complete: () => patchState(store, { isLoggingOut: false }),
					error: (error) => {
						// TODO: Replace with security event logging (see issue #66)
						console.error('[AuthStore] Logout error:', error);
						patchState(store, { isLoggingOut: false });
					},
				});
			},

			/**
			 * Refresh access token
			 *
			 * Called by the token refresh interceptor when a 401 response is received.
			 * Updates currentUser with new token and stores in localStorage.
			 *
			 * @example
			 * // In an HTTP interceptor
			 * authStore.startTokenRefresh();
			 *
			 * return authStore.refreshToken().pipe(
			 *   switchMap((newTokens) => {
			 *     authStore.completeTokenRefresh();
			 *     const retryReq = req.clone({
			 *       setHeaders: { Authorization: `Bearer ${newTokens.token}` },
			 *     });
			 *     return next(retryReq);
			 *   }),
			 *   catchError((refreshError) => {
			 *     authStore.failTokenRefresh();
			 *     authStore.logout();
			 *     return throwError(() => refreshError);
			 *   }),
			 * );
			 */
			refreshToken() {
				return authApi.refreshToken().pipe(
					tap((response) => {
						const currentUser = store.currentUser();
						if (currentUser) {
							const updatedUser = createUser({
								id: currentUser.id,
								email: currentUser.email,
								firstName: currentUser.firstName,
								lastName: currentUser.lastName,
								roles: [...currentUser.roles],
								token: response.token,
							});
							patchState(store, {
								currentUser: updatedUser,
								pendingRefreshToken: response.token,
							});
							const storageData = mapUserToStorageData(updatedUser);
							localStorage.setItem('auth_user', JSON.stringify(storageData));
						}
					}),
				);
			},

			/**
			 * Reset pending refresh token (after interceptor uses it)
			 */
			clearPendingRefreshToken() {
				patchState(store, { pendingRefreshToken: null });
			},

			/**
			 * Start token refresh - sets refreshing flag and clears pending token
			 */
			startTokenRefresh() {
				patchState(store, { isTokenRefreshing: true, pendingRefreshToken: null });
			},

			/**
			 * Complete token refresh - clears refreshing flag
			 */
			completeTokenRefresh() {
				patchState(store, { isTokenRefreshing: false });
			},

			/**
			 * Handle token refresh failure - atomically resets refresh state
			 *
			 * Clears both isTokenRefreshing and pendingRefreshToken in a single
			 * state update. Use this instead of calling completeTokenRefresh()
			 * and clearPendingRefreshToken() separately on error paths.
			 */
			failTokenRefresh() {
				patchState(store, { isTokenRefreshing: false, pendingRefreshToken: null });
			},

			/**
			 * Restore user from localStorage
			 *
			 * Called by route guards to restore authenticated session.
			 * Validates stored data with Zod schema before restoring.
			 * Sets isInitialized to true once complete.
			 */
			restoreFromStorage() {
				const storedUser = localStorage.getItem('auth_user');
				if (storedUser) {
					try {
						const result = authStorageDataSchema.safeParse(JSON.parse(storedUser));
						if (result.success) {
							const user = mapStorageDataToUser(result.data);
							patchState(store, { currentUser: user });
						} else {
							localStorage.removeItem('auth_user');
						}
					} catch {
						localStorage.removeItem('auth_user');
					}
				}
				patchState(store, { isInitialized: true });
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
				const storageData = mapUserToStorageData(user);
				localStorage.setItem('auth_user', JSON.stringify(storageData));
			},

			/**
			 * Set token refreshing status
			 */
			setTokenRefreshing(refreshing: boolean) {
				patchState(store, { isTokenRefreshing: refreshing });
			},
		};
	}),
);
