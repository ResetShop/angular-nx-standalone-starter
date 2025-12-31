import { AuthUser, RefreshTokenResponse } from '@interfaces/auth';
import { compare } from 'bcryptjs';
import { createHash } from 'crypto';
import { pasetoService } from '../../services/paseto.service';
import { parseDurationToMs } from '../../utils/duration';
import { UserRepository } from '../user/user.repository';
import { AuthenticationRepository } from './authentication.repository';
import { RefreshTokenRepository } from './refresh-token.repository';

interface LoginParams {
	email: string;
	password: string;
}

/**
 * Complete authentication result from the service layer.
 * The controller extracts the refresh token to store in HttpOnly cookie
 * and returns only user + token in the HTTP response.
 */
interface AuthResult {
	user: AuthUser;
	token: string;
	refreshToken: string;
}

export class AuthService {
	constructor(
		private userRepository: UserRepository = new UserRepository(),
		private authRepository: AuthenticationRepository = new AuthenticationRepository(),
		private refreshTokenRepository: RefreshTokenRepository = new RefreshTokenRepository(),
	) {}

	/**
	 * Get refresh token expiry date based on environment variable
	 * @returns Date object representing expiry time
	 */
	private getRefreshTokenExpiry(): Date {
		// duration is read directly from env vars to allow changing the generated refresh token expiration time at runtime
		const duration = process.env['PASETO_REFRESH_TOKEN_EXPIRY'] ?? '7d';
		const expiryMs = parseDurationToMs(duration);
		return new Date(Date.now() + expiryMs);
	}

	/**
	 * Authenticate user and generate Paseto tokens.
	 * If authentication succeeds, a refresh token is also generated and stored in the database.
	 * @param credentials - Login credentials (email and password)
	 * @returns LoginResponse object containing user data, access token, and refresh token.
	 */
	async authenticate(credentials: LoginParams): Promise<AuthResult> {
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
			// TODO: Increment failed login attempts
			throw new Error('Invalid credentials');
		}

		// Cleanup expired tokens for this user
		await this.refreshTokenRepository.deleteExpiredTokensForUser(foundUser.id);

		// Generate Paseto tokens
		const accessToken = await pasetoService.generateAccessToken({
			sub: foundUser.id.toString(),
			email: foundUser.email,
			firstName: foundUser.firstName,
			lastName: foundUser.lastName,
		});

		const tokenFamily = crypto.randomUUID();
		const refreshToken = await pasetoService.generateRefreshToken(foundUser.id.toString(), tokenFamily);

		// Store refresh token in database
		const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
		await this.refreshTokenRepository.create({
			userId: foundUser.id,
			tokenFamily: tokenFamily,
			tokenHash: refreshTokenHash,
			expiresAt: this.getRefreshTokenExpiry(),
		});

		return {
			user: foundUser,
			token: accessToken,
			refreshToken: refreshToken,
		};
	}

	/**
	 * Refresh access token using a refresh token.
	 * This method checks if the refresh token is valid, and if so, generates a new access token and returns it.
	 * @param token - Refresh token to use for token refresh
	 * @returns AuthResponse object containing user data, access token, and refresh token.
	 */
	async refreshToken(token: string): Promise<RefreshTokenResponse> {
		// 1. Verify refresh token
		const payload = await pasetoService.verifyRefreshToken(token);

		// 2. Check if token is revoked in database
		const tokenHash = createHash('sha256').update(token).digest('hex');
		const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

		if (!storedToken || storedToken.isRevoked) {
			throw new Error('Invalid refresh token');
		}

		// 3. Check if token is expired
		if (storedToken.expiresAt < new Date()) {
			throw new Error('Refresh token expired');
		}

		// 4. Get user data
		const user = await this.userRepository.findById(Number(payload.sub));
		if (!user) {
			throw new Error('User not found');
		}

		// 5. Generate new tokens
		const newAccessToken = await pasetoService.generateAccessToken({
			sub: user.id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		});

		const newRefreshToken = await pasetoService.generateRefreshToken(
			user.id.toString(),
			payload.tokenFamily, // Maintain token family for rotation
		);

		// 6. Revoke old refresh token
		await this.refreshTokenRepository.revokeToken(storedToken.id);

		// 7. Store new refresh token
		const newTokenHash = createHash('sha256').update(newRefreshToken).digest('hex');
		await this.refreshTokenRepository.create({
			userId: user.id,
			tokenFamily: payload.tokenFamily || crypto.randomUUID(),
			tokenHash: newTokenHash,
			expiresAt: this.getRefreshTokenExpiry(),
		});

		return {
			token: newAccessToken,
			refreshToken: newRefreshToken,
		};
	}

	/**
	 * Revoke all refresh tokens for a user.
	 * This method is called when a user logs out, to ensure that no stale refresh tokens remain in the database.
	 * @param userId
	 */
	async logout(userId: number): Promise<void> {
		// Revoke all refresh tokens for this user
		await this.refreshTokenRepository.revokeAllForUser(userId);

		// Delete all expired tokens for this user
		await this.refreshTokenRepository.deleteExpiredTokensForUser(userId);
	}
}
