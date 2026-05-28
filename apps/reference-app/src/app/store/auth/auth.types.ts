import type { AuthErrorResponse, LoginErrorResponse } from '@contracts/auth/auth.errors'
import type { IUser } from '@domain/user/user.interface'

/**
 * Auth state structure for NgRx Signal Store
 */
export interface AuthState {
	/** Currently authenticated user, or null if not logged in */
	currentUser: IUser | null

	/** Whether a token refresh operation is currently in progress */
	isTokenRefreshing: boolean

	/** Whether a login request is currently in progress */
	isLoggingIn: boolean

	/** Whether a logout request is currently in progress */
	isLoggingOut: boolean

	/** Login error from the last failed login attempt (null if no error) */
	loginError: LoginErrorResponse | null

	/** Whether a network/server error occurred during login (5xx or connection failure) */
	networkError: boolean

	/** Whether the user must change their password (set at login, reset on logout) */
	mustChangePassword: boolean

	/** Whether a change-password request is currently in progress */
	isChangingPassword: boolean

	/** Error from the last failed change-password attempt (null if no error) */
	changePasswordError: AuthErrorResponse | null

	/** Whether a forgot-password (request reset) call is in progress */
	isRequestingReset: boolean

	/** Whether a forgot-password request has completed — drives the neutral "link sent" confirmation */
	resetRequested: boolean

	/** Whether a reset-password (with token) call is in progress */
	isResettingPassword: boolean

	/** Error from the last failed reset-password attempt (null if no error) */
	resetPasswordError: AuthErrorResponse | null
}

/**
 * Initial auth state
 */
export const initialAuthState: AuthState = {
	currentUser: null,
	isTokenRefreshing: false,
	isLoggingIn: false,
	isLoggingOut: false,
	loginError: null,
	networkError: false,
	mustChangePassword: false,
	isChangingPassword: false,
	changePasswordError: null,
	isRequestingReset: false,
	resetRequested: false,
	isResettingPassword: false,
	resetPasswordError: null,
}
