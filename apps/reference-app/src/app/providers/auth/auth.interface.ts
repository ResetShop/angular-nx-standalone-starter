import { InjectionToken } from '@angular/core'
import type { LoginRequest, LoginResponse, MeResponse, RefreshResponse } from '@contracts/auth/auth.types'
import type { Observable } from 'rxjs'

export interface AuthApi {
	login(params: LoginRequest): Observable<LoginResponse>
	logout(): Observable<void>
	refreshToken(): Observable<RefreshResponse>
	getMe(): Observable<MeResponse>
}

export const AuthApi = new InjectionToken<AuthApi>('AuthApi')
