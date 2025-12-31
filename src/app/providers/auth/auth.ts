import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { LoginFormParams, LoginResponse, RefreshTokenResponse } from '@interfaces/auth';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Auth {
	private http = inject(HttpClient);
	private platformId = inject(PLATFORM_ID);

	readonly currentUser = computed(() => this._currentUser());
	readonly isAuthenticated = computed(() => !!this._currentUser());
	readonly isInitialized = signal(false);
	readonly isGuardValidated = signal(false);
	private readonly minLoadingTimeElapsed = signal(false);

	readonly isLoadingComplete = computed(
		() => this.isInitialized() && this.isGuardValidated() && this.minLoadingTimeElapsed(),
	);

	private readonly _currentUser = signal<null | LoginResponse>(null);

	login(params: LoginFormParams) {
		return this.http.post<LoginResponse>('/api/auth/login', params, { withCredentials: true }).pipe(
			tap((response) => {
				localStorage.setItem('auth_user', JSON.stringify(response));
				this._currentUser.set(response);
			}),
		);
	}

	/**
	 * Refresh access token using refresh token from HttpOnly cookie
	 */
	refreshToken(): Observable<RefreshTokenResponse> {
		// No need to send refresh token - it's in the HttpOnly cookie
		return this.http
			.post<RefreshTokenResponse>(
				'/api/auth/refresh',
				{}, // Empty body - token is in cookie
				{ withCredentials: true }, // Send cookies with request
			)
			.pipe(
				tap((response) => {
					// Update stored access token
					const currentUser = this._currentUser();
					if (currentUser) {
						const updatedUser = {
							...currentUser,
							token: response.token,
							// Refresh token updated automatically via cookie
						};
						this._currentUser.set(updatedUser);
						localStorage.setItem('auth_user', JSON.stringify(updatedUser));
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
			this._currentUser.set(JSON.parse(storedUser));
		}
		this.isInitialized.set(true);

		// Ensure loading screen is visible for a minimum amount of time
		setTimeout(() => {
			this.minLoadingTimeElapsed.set(true);
		}, 1000);
	}

	/**
	 * Sends a request to the backend to revoke refresh tokens and deletes cookies.
	 * Clears user state immediately for responsive UI.
	 */
	logout() {
		// Capture current user before clearing
		const currentUser = this._currentUser();

		// Clear user state immediately for responsive UI and navigation
		this._currentUser.set(null);
		localStorage.removeItem('auth_user');

		// Call backend to revoke refresh tokens and delete cookie
		// Pass token explicitly in headers since we just cleared the user state
		if (currentUser?.token) {
			this.http
				.post('/api/auth/logout', currentUser, {
					withCredentials: true,
					headers: {
						Authorization: `Bearer ${currentUser.token}`,
					},
				})
				.subscribe({
					error: (error) => console.error('Logout error:', error),
				});
		}
	}
}
