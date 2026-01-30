import type { LoginErrorResponse } from '@contracts/auth/auth.errors';
import type { IUser } from '@domain/user/user.interface';

/**
 * Auth state structure for NgRx Signal Store
 */
export interface AuthState {
	currentUser: IUser | null;
	isInitialized: boolean;
	isGuardValidated: boolean;
	isTokenRefreshing: boolean;
	isLoggingIn: boolean;
	isLoggingOut: boolean;
	loginError: LoginErrorResponse | null;
	networkError: boolean;
	minLoadingTimeElapsed: boolean;
	pendingRefreshToken: string | null;
}

/**
 * Initial auth state
 */
export const initialAuthState: AuthState = {
	currentUser: null,
	isInitialized: false,
	isGuardValidated: false,
	isTokenRefreshing: false,
	isLoggingIn: false,
	isLoggingOut: false,
	loginError: null,
	networkError: false,
	minLoadingTimeElapsed: false,
	pendingRefreshToken: null,
};
