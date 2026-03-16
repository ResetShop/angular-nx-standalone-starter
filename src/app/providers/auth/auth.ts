import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import type { LoginRequest, LoginResponse, MeResponse, RefreshResponse } from '@contracts/auth/auth.types'
import type { Observable } from 'rxjs'

/**
 * Auth API Service - HTTP Layer
 *
 * Pure API client for authentication endpoints.
 * No state management - just HTTP operations.
 * Injected and used by AuthStore.
 */
@Injectable({ providedIn: 'root' })
export class AuthApiService {
	private readonly http = inject(HttpClient)

	/**
	 * Login with email and password
	 */
	public login(params: LoginRequest): Observable<LoginResponse> {
		return this.http.post<LoginResponse>('/api/auth/login', params)
	}

	/**
	 * Logout user - revoke server-side tokens
	 */
	public logout(): Observable<void> {
		return this.http.post<void>('/api/auth/logout', {})
	}

	/**
	 * Refresh access token using refresh token from HttpOnly cookie
	 */
	public refreshToken(): Observable<RefreshResponse> {
		return this.http.post<RefreshResponse>('/api/auth/refresh', {})
	}

	/**
	 * Token introspection - verify token and get user data
	 */
	public getMe(): Observable<MeResponse> {
		return this.http.get<MeResponse>('/api/auth/me')
	}
}
