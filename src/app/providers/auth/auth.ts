import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoginFormParams, LoginResponse, RefreshTokenResponse, TokenIntrospectionResponse } from '@interfaces/auth';
import { BehaviorSubject, Observable, tap } from 'rxjs';

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

	private readonly _currentUser = signal<null | LoginResponse>(null);

	ngOnDestroy() {
		this.refreshTokenSubject.complete();
	}

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
	 * Token introspection - verifies current token and returns user data.
	 * Useful for checking token validity and refreshing user info from server.
	 */
	getMe(): Observable<TokenIntrospectionResponse> {
		return this.http.get<TokenIntrospectionResponse>('/api/auth/me', { withCredentials: true });
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
				console.error('Logout error:', error);
				this.router.navigate(['..', 'auth', 'login']);
			},
		});
	}
}
