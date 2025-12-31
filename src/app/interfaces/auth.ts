import { FormControl } from '@angular/forms';

export interface RefreshTokenResponse {
	token: string;
	refreshToken: string;
}

export interface LoginForm {
	email: FormControl<string>;
	password: FormControl<string>;
}

export interface LoginFormParams {
	email: string;
	password: string;
}

export interface LoginResponse {
	user: AuthUser;
	token: string;
}

export interface AuthUser {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	enabled: boolean;
}
