import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { LoginRequest, LoginResponse, MeResponse, RefreshResponse } from '@contracts/auth/auth.types';
import { authStorageDataSchema } from '@domain/auth/auth-storage.type';
import { mapLoginResponseToUser, mapStorageDataToUser, mapUserToStorageData } from '@domain/auth/auth.mapper';
import type { IUser } from '@domain/user/user.interface';
import { createUser } from '@domain/user/user.mapper';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Auth implements OnDestroy {
	private http = inject(HttpClient);
	private platformId = inject(PLATFORM_ID);
	private router = inject(Router);

	// Shared state for coordinating token refresh across requests
	public refreshTokenSubject = new BehaviorSubject<string | null>(null);
	readonly isTokenRefreshing = signal(false);

	readonly currentUser = computed(() => this._currentUser());
	readonly isAuthenticated = computed(() => !!this._currentUser());
	readonly isInitialized = signal(false);
	readonly isGuardValidated = signal(false);
	private readonly minLoadingTimeElapsed = signal(false);

	readonly isLoadingComplete = computed(
		() => this.isInitialized() && this.isGuardValidated() && this.minLoadingTimeElapsed(),
	);

	private readonly _currentUser = signal<IUser | null>(null);

	ngOnDestroy() {
		this.refreshTokenSubject.complete();
	}

	login(params: LoginRequest) {
		return this.http.post<LoginResponse>('/api/auth/login', params, { withCredentials: true }).pipe(
			map((response) => mapLoginResponseToUser(response)),
			tap((user) => {
				const storageData = mapUserToStorageData(user);
				localStorage.setItem('auth_user', JSON.stringify(storageData));
				this._currentUser.set(user);
			}),
		);
	}

	/**
	 * Refresh access token using refresh token from HttpOnly cookie
	 */
	refreshToken(): Observable<RefreshResponse> {
		// No need to send refresh token - it's in the HttpOnly cookie
		return this.http
			.post<RefreshResponse>(
				'/api/auth/refresh',
				{}, // Empty body - token is in cookie
				{ withCredentials: true }, // Send cookies with request
			)
			.pipe(
				tap((response) => {
					// Update stored access token
					const currentUser = this._currentUser();
					if (currentUser) {
						const updatedUser = createUser(
							currentUser.id,
							currentUser.email,
							currentUser.firstName,
							currentUser.lastName,
							[...currentUser.roles],
							response.token,
						);
						this._currentUser.set(updatedUser);
						const storageData = mapUserToStorageData(updatedUser);
						localStorage.setItem('auth_user', JSON.stringify(storageData));
					}
				}),
			);
	}

	retrieveFromStorage() {
		if (isPlatformServer(this.platformId)) {
			this.isInitialized.set(true);
			return;
		}
		const storedUser = localStorage.getItem('auth_user');
		if (storedUser) {
			const result = authStorageDataSchema.safeParse(JSON.parse(storedUser));
			if (result.success) {
				const user = mapStorageDataToUser(result.data);
				this._currentUser.set(user);
			} else {
				localStorage.removeItem('auth_user');
			}
		}
		this.isInitialized.set(true);

		// Ensure loading screen is visible for a minimum amount of time
		setTimeout(() => {
			this.minLoadingTimeElapsed.set(true);
		}, 1000);
	}

	/**
	 * Token introspection - verifies current token and returns user data.
	 * Useful for checking token validity and refreshing user info from server.
	 */
	getMe(): Observable<MeResponse> {
		return this.http.get<MeResponse>('/api/auth/me', { withCredentials: true });
	}

	/**
	 * Logout user by clearing local state and revoking server-side tokens.
	 * Uses refresh token from cookie (no access token needed).
	 */
	logout() {
		// Clear user state immediately for responsive UI
		this._currentUser.set(null);
		localStorage.removeItem('auth_user');

		// Call backend to revoke refresh tokens and delete cookie
		// No access token needed - backend uses refresh token from cookie
		this.http.post('/api/auth/logout', {}, { withCredentials: true }).subscribe({
			next: () => {
				this.router.navigate(['..', 'auth', 'login']);
			},
			error: (error) => {
				console.error('[Auth] Logout error:', error);
				this.router.navigate(['..', 'auth', 'login']);
			},
		});
	}
}
