import { InjectionToken } from '@angular/core'
import type {
	ChangePasswordRequest,
	ChangePasswordResponse,
	LoginRequest,
	LoginResponse,
	MeResponse,
	RefreshResponse,
} from '@contracts/auth/auth.types'
import type { Observable } from 'rxjs'

export interface AuthApi {
	login(params: LoginRequest): Observable<LoginResponse>
	logout(): Observable<void>
	refreshToken(): Observable<RefreshResponse>
	getMe(): Observable<MeResponse>
	changePassword(params: ChangePasswordRequest): Observable<ChangePasswordResponse>
}

export const AuthApi = new InjectionToken<AuthApi>('AuthApi')
