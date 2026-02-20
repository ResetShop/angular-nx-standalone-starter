import type { LoginErrorResponse } from '@contracts/auth/auth.errors';
import type { IUser } from '@domain/user/user.interface';

/**
 * Auth state structure for NgRx Signal Store
 */
export interface AuthState {
	/** Currently authenticated user, or null if not logged in */
	currentUser: IUser | null;

	/** Whether auth state has been initialized (getMe() completed or failed) */
	isInitialized: boolean;

	/** Whether a token refresh operation is currently in progress */
	isTokenRefreshing: boolean;

	/** Whether a login request is currently in progress */
	isLoggingIn: boolean;

	/** Whether a logout request is currently in progress */
	isLoggingOut: boolean;

	/** Login error from the last failed login attempt (null if no error) */
	loginError: LoginErrorResponse | null;

	/** Whether a network/server error occurred during login (5xx or connection failure) */
	networkError: boolean;

	/** Whether the user must change their password (set at login, reset on logout) */
	mustChangePassword: boolean;
}

/**
 * Initial auth state
 */
export const initialAuthState: AuthState = {
	currentUser: null,
	isInitialized: false,
	isTokenRefreshing: false,
	isLoggingIn: false,
	isLoggingOut: false,
	loginError: null,
	networkError: false,
	mustChangePassword: false,
};
