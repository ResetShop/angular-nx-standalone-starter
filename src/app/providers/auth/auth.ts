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
		return this.http.post<LoginResponse>('/api/auth/login', params).pipe(
			tap((response) => {
				localStorage.setItem('auth_user', JSON.stringify(response));
				this._currentUser.set(response);
			}),
		);
	}

	/**
	 * Refresh access token using refresh token
	 */
	refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
		return this.http.post<RefreshTokenResponse>('/api/auth/refresh', { refreshToken }).pipe(
			tap((response) => {
				// Update stored tokens
				const currentUser = this._currentUser();
				if (currentUser) {
					const updatedUser = {
						...currentUser,
						token: response.token,
						refreshToken: response.refreshToken,
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

	logout() {
		// Call backend to revoke refresh tokens
		const currentUser = this._currentUser();
		if (currentUser?.token) {
			this.http.post('/api/auth/logout', {}).subscribe({
				error: (error) => console.error('Logout error:', error),
			});
		}

		this._currentUser.set(null);
		localStorage.removeItem('auth_user');
	}
}
