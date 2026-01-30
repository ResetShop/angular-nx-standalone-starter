import { isPlatformServer } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, PLATFORM_ID } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { authStorageDataSchema } from '@domain/auth/auth-storage.type';
import { mapLoginResponseToUser, mapStorageDataToUser, mapUserToStorageData } from '@domain/auth/auth.mapper';
import type { IUser } from '@domain/user/user.interface';
import { createUser } from '@domain/user/user.mapper';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { AuthApiService } from '@providers/auth/auth';
import { pipe, switchMap, tap } from 'rxjs';
import { initialAuthState } from './auth.types';

const MIN_LOADING_SCREEN_DURATION = 1000;

/**
 * AuthStore - Signal Store for authentication state
 *
 * Manages authentication state using NgRx Signal Store.
 * Components inject this store directly for all auth operations.
 * Uses AuthApiService for HTTP calls.
 */
export const AuthStore = signalStore(
	{ providedIn: 'root' },
	withState(initialAuthState),
	withComputed((store) => ({
		isAuthenticated: computed(() => !!store.currentUser()),
		isLoadingComplete: computed(
			() => store.isInitialized() && store.isGuardValidated() && store.minLoadingTimeElapsed(),
		),
		userPermissions: computed(() => store.currentUser()?.permissions ?? []),
		userRoles: computed(() => store.currentUser()?.roles ?? []),
	})),
	withMethods((store) => {
		const authApi = inject(AuthApiService);
		const platformId = inject(PLATFORM_ID);

		return {
			/**
			 * Get observable stream of pending refresh token for interceptor coordination
			 */
			getPendingRefreshToken$() {
				return toObservable(store.pendingRefreshToken);
			},

			/**
			 * Login with email and password
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
									// Distinguish between auth errors and network errors
									const isNetworkError = error.status === 0 || error.status >= 500;
									patchState(store, {
										isLoggingIn: false,
										loginError: isNetworkError ? null : error.error,
										networkError: isNetworkError,
									});
								},
							}),
						),
					),
				),
			),

			/**
			 * Logout user - clear state and revoke tokens
			 */
			logout() {
				patchState(store, { currentUser: null, isLoggingOut: true });
				localStorage.removeItem('auth_user');

				authApi.logout().subscribe({
					complete: () => patchState(store, { isLoggingOut: false }),
					error: (error) => {
						console.error('[AuthStore] Logout error:', error);
						patchState(store, { isLoggingOut: false });
					},
				});
			},

			/**
			 * Refresh access token
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
			 * Restore user from localStorage
			 */
			restoreFromStorage() {
				if (isPlatformServer(platformId)) {
					patchState(store, { isInitialized: true });
					return;
				}

				const storedUser = localStorage.getItem('auth_user');
				if (storedUser) {
					const result = authStorageDataSchema.safeParse(JSON.parse(storedUser));
					if (result.success) {
						const user = mapStorageDataToUser(result.data);
						patchState(store, { currentUser: user });
					} else {
						localStorage.removeItem('auth_user');
					}
				}
				patchState(store, { isInitialized: true });

				// Ensure loading screen visible for minimum duration (MIN_LOADING_SCREEN_DURATION = 1000ms)
				setTimeout(() => {
					patchState(store, { minLoadingTimeElapsed: true });
				}, MIN_LOADING_SCREEN_DURATION);
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
			 * Set guard validation status
			 */
			setGuardValidated(validated: boolean) {
				patchState(store, { isGuardValidated: validated });
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
