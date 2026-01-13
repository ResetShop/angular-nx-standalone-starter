import { AuthUser, RefreshTokenResponse } from '@interfaces/auth';
import { compare } from 'bcryptjs';
import { createHash } from 'crypto';
import { type IPasetoService } from '../../services/paseto/interfaces';
import { parseDurationToMs } from '../../utils/duration';
import { type IUserRepository } from '../user/interfaces';
import { type CleanupResult, type IAuthenticationRepository, type IRefreshTokenRepository } from './interfaces';

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

export const AUTH_ERRORS = {
	INVALID_CREDENTIALS: 'Invalid credentials',
	TOKEN_EXPIRED: 'Token has expired',
	TOKEN_INVALID: 'Invalid token',
	ACCOUNT_DISABLED: 'Account is disabled',
	ACCOUNT_DELETED: 'Account is deleted',
	USER_NOT_FOUND: 'User not found',
	AUTH_RECORD_NOT_FOUND: 'Authentication record not found',
} as const;

interface AuthServiceDeps {
	userRepository: IUserRepository;
	authRepository: IAuthenticationRepository;
	refreshTokenRepository: IRefreshTokenRepository;
	pasetoService: IPasetoService;
}

export class AuthService {
	private userRepository: IUserRepository;
	private authRepository: IAuthenticationRepository;
	private refreshTokenRepository: IRefreshTokenRepository;
	private pasetoService: IPasetoService;

	constructor({ userRepository, authRepository, refreshTokenRepository, pasetoService }: AuthServiceDeps) {
		this.userRepository = userRepository;
		this.authRepository = authRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.pasetoService = pasetoService;
	}

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
		const authRecord = foundUser ? await this.authRepository.findByUserId(foundUser.id) : null;

		// Compare with dummy hash if hash is not set, so to avoid creating timing differences in auth endpoint
		// responses that could be used to allow attackers to enumerate valid email addresses
		const hashToCompare = authRecord?.passwordHash ?? '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummy';
		const passwordMatch = await compare(credentials.password, hashToCompare);

		if (!foundUser || !authRecord || !passwordMatch || foundUser.deleted || !foundUser.enabled) {
			if (!foundUser) {
				console.error(AUTH_ERRORS.USER_NOT_FOUND);
			} else if (!authRecord) {
				console.error(AUTH_ERRORS.AUTH_RECORD_NOT_FOUND);
			} else if (!passwordMatch) {
				console.error(AUTH_ERRORS.INVALID_CREDENTIALS);
			} else if (foundUser.deleted) {
				console.error(AUTH_ERRORS.ACCOUNT_DELETED);
			} else if (!foundUser.enabled) {
				console.error(AUTH_ERRORS.ACCOUNT_DISABLED);
			}

			throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS); // Don't reveal that account exists but is disabled/deleted
		}

		// Cleanup expired tokens for this user
		await this.refreshTokenRepository.deleteExpiredTokensForUser(foundUser.id);

		// Generate Paseto tokens
		const accessToken = await this.pasetoService.generateAccessToken({
			sub: foundUser.id.toString(),
			email: foundUser.email,
			firstName: foundUser.firstName,
			lastName: foundUser.lastName,
		});

		const tokenFamily = crypto.randomUUID();
		const refreshToken = await this.pasetoService.generateRefreshToken(foundUser.id.toString(), tokenFamily);

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
		const payload = await this.pasetoService.verifyRefreshToken(token);

		// 2. Validate token family exists (required for rotation tracking)
		if (!payload.tokenFamily) {
			throw new Error('Invalid refresh token: missing token family');
		}

		// 3. Check if token is revoked in database
		const tokenHash = createHash('sha256').update(token).digest('hex');
		const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

		if (!storedToken || storedToken.isRevoked) {
			throw new Error('Invalid refresh token');
		}

		// 4. Check if token is expired
		if (storedToken.expiresAt < new Date()) {
			throw new Error('Refresh token expired');
		}

		// 5. Get user data and validate account status
		const user = await this.userRepository.findById(Number(payload.sub));
		if (!user || user.deleted) {
			throw new Error('User not found');
		}

		if (!user.enabled) {
			throw new Error('Account is disabled');
		}

		// 6. Generate new tokens
		const newAccessToken = await this.pasetoService.generateAccessToken({
			sub: user.id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		});

		const newRefreshToken = await this.pasetoService.generateRefreshToken(
			user.id.toString(),
			payload.tokenFamily, // Maintain token family for rotation
		);

		// 7. Revoke old refresh token
		await this.refreshTokenRepository.revokeToken(storedToken.id);

		// 8. Store new refresh token
		const newTokenHash = createHash('sha256').update(newRefreshToken).digest('hex');
		await this.refreshTokenRepository.create({
			userId: user.id,
			tokenFamily: payload.tokenFamily,
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

	/**
	 * Delete all expired refresh tokens from the database.
	 * Used by the cron job and manual cleanup endpoint.
	 * Uses PostgreSQL advisory lock to prevent concurrent executions across multiple server instances.
	 * @returns CleanupResult with count and incomplete flag, or null if skipped due to concurrent execution or lock error
	 */
	async cleanupExpiredTokens(): Promise<CleanupResult | null> {
		// Try to acquire database-level lock (works across multiple server instances)
		let lockAcquired = false;
		try {
			lockAcquired = await this.refreshTokenRepository.tryAcquireCleanupLock();
		} catch (error) {
			console.error('[TokenCleanup] Failed to acquire advisory lock:', error);
			return null;
		}

		if (!lockAcquired) {
			console.log('[TokenCleanup] Skipped - cleanup already in progress (another instance holds the lock)');
			return null;
		}

		try {
			const startTime = Date.now();
			const result = await this.refreshTokenRepository.deleteAllExpiredTokens();
			const durationMs = Date.now() - startTime;

			// Structured logging for monitoring/metrics collection
			console.log(
				JSON.stringify({
					event: 'token_cleanup',
					deletedCount: result.deletedCount,
					durationMs,
					incomplete: result.incomplete,
					timestamp: new Date().toISOString(),
				}),
			);

			// Human-readable summary
			console.log(`[TokenCleanup] Deleted ${result.deletedCount} expired tokens in ${durationMs}ms`);
			if (result.incomplete) {
				console.warn('[TokenCleanup] Cleanup was incomplete - more expired tokens may remain');
			}
			return result;
		} finally {
			try {
				await this.refreshTokenRepository.releaseCleanupLock();
			} catch (error) {
				// PostgreSQL session advisory locks (pg_advisory_lock) are automatically
				// released when the database session/connection ends. This is a safety net
				// - the lock won't persist indefinitely even if explicit release fails.
				// In serverless with connection pooling, the lock releases when the
				// pooled connection is recycled or the pool closes.
				console.error(
					'[TokenCleanup] Failed to release advisory lock. Lock will auto-release when DB session ends:',
					error,
				);
			}
		}
	}
}
