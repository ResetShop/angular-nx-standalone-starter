import type { IUser } from '@domain/user/user.interface'

export interface AuthState {
	currentUser: IUser | null
	isLoggingIn: boolean
	isLoggingOut: boolean
	loginError: string | null
}

export const initialAuthState: AuthState = {
	currentUser: null,
	isLoggingIn: false,
	isLoggingOut: false,
	loginError: null,
}
