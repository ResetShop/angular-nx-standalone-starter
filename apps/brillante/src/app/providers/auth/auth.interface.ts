import { InjectionToken } from '@angular/core'
import type {
	ChangePasswordRequest,
	ChangePasswordResponse,
	ForgotPasswordRequest,
	ForgotPasswordResponse,
	LegacyTokenResponse,
	LoginRequest,
	LoginResponse,
	MeResponse,
	RefreshResponse,
	ResetPasswordRequest,
	ResetPasswordResponse,
} from '@contracts/auth/auth.types'
import type { AuthUser, UpdateProfileRequest } from '@contracts/user/user.types'
import type { Observable } from 'rxjs'

export interface AuthApi {
	login(params: LoginRequest): Observable<LoginResponse>
	logout(): Observable<void>
	refreshToken(): Observable<RefreshResponse>
	getMe(): Observable<MeResponse>
	changePassword(params: ChangePasswordRequest): Observable<ChangePasswordResponse>
	forgotPassword(params: ForgotPasswordRequest): Observable<ForgotPasswordResponse>
	resetPassword(params: ResetPasswordRequest): Observable<ResetPasswordResponse>
	updateProfile(params: UpdateProfileRequest): Observable<AuthUser>
	/** A token for the legacy API, issued for the signed-in user. */
	getLegacyToken(): Observable<LegacyTokenResponse>
}

export const AuthApi = new InjectionToken<AuthApi>('AuthApi')
