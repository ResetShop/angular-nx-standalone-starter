import { compare } from 'bcryptjs';
import { UserRepository } from '../user/user.repository';
import { AuthenticationRepository } from './authentication.repository';

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface AuthResponse {
	user: {
		id: number;
		email: string;
		firstName: string;
		lastName: string;
		enabled: boolean;
	};
	token: string;
	refreshToken: string;
}

export class AuthService {
	constructor(
		private userRepository: UserRepository = new UserRepository(),
		private authRepository: AuthenticationRepository = new AuthenticationRepository(),
	) {}

	async authenticate(credentials: LoginCredentials): Promise<AuthResponse> {
		const foundUser = await this.userRepository.findByEmail(credentials.email);

		if (!foundUser) {
			throw new Error('Invalid credentials');
		}

		const authRecord = await this.authRepository.findByUserId(foundUser.id);

		if (!authRecord) {
			throw new Error('Authentication record not found');
		}

		const passwordMatch = await compare(credentials.password, authRecord.passwordHash);

		if (!passwordMatch) {
			throw new Error('Invalid credentials');
		}

		return {
			user: foundUser,
			// TODO: Implement access token and refresh token generation
			token: 'jwt-token-placeholder',
			refreshToken: 'refresh-token-placeholder',
		};
	}
}
