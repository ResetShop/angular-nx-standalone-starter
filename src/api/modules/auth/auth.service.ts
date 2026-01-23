import type { AuthUser } from '@contracts/users/users.types';
import { compare } from 'bcryptjs';
import crypto, { createHash } from 'crypto';
import { DEFAULT_LOCKOUT_DURATION, DEFAULT_MAX_FAILED_ATTEMPTS } from '../../constants/auth.constants';
import { type IPasetoService } from '../../services/paseto/interfaces';
import { parseDurationToMs } from '../../utils/duration';
import { type IUserRepository, type User } from '../user/interfaces';
import {
	type AuthenticationData,
	type CleanupResult,
	type IAuthenticationRepository,
	type IRefreshTokenRepository,
} from './interfaces';

interface LoginParams {
	email: string;
	password: string;
}

/**
 * Internal refresh token response from service layer.
 * Includes refreshToken which the controller extracts for HttpOnly cookie.
 */
interface InternalRefreshResponse {
	token: string;
	refreshToken: string;
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
	ACCOUNT_LOCKED: 'Account is temporarily locked due to too many failed login attempts',
	USER_NOT_FOUND: 'User not found',
	AUTH_RECORD_NOT_FOUND: 'Authentication record not found',
} as const;

interface AuthServiceDeps {
	userRepository: IUserRepository;
	authRepository: IAuthenticationRepository;
	refreshTokenRepository: IRefreshTokenRepository;
	pasetoService: IPasetoService;
}

/**
 * Service for user authentication and token management.
 * Handles login, logout, token refresh, and expired token cleanup.
 * Uses PASETO tokens for secure, stateless authentication with refresh token rotation.
 */
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
	 * Calculates refresh token expiry date based on PASETO_REFRESH_TOKEN_EXPIRY env variable.
	 *
	 * @returns Date object representing the token expiration time
	 */
	private getRefreshTokenExpiry(): Date {
		// duration is read directly from env vars to allow changing the generated refresh token expiration time at runtime
		const duration = process.env['PASETO_REFRESH_TOKEN_EXPIRY'] ?? '7d';
		const expiryMs = parseDurationToMs(duration);
		return new Date(Date.now() + expiryMs);
	}

	/**
	 * Gets the maximum number of failed login attempts before account lockout.
	 * Configurable via AUTH_MAX_FAILED_ATTEMPTS environment variable.
	 *
	 * @returns Maximum failed attempts threshold
	 */
	private getMaxFailedAttempts(): number {
		const envValue = process.env['AUTH_MAX_FAILED_ATTEMPTS'];
		const parsed = parseInt(envValue ?? '', 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_FAILED_ATTEMPTS;
	}

	/**
	 * Gets the account lockout duration in milliseconds.
	 * Configurable via AUTH_LOCKOUT_DURATION environment variable.
	 *
	 * @returns Lockout duration in milliseconds
	 */
	private getLockoutDuration(): number {
		const duration = process.env['AUTH_LOCKOUT_DURATION'] ?? DEFAULT_LOCKOUT_DURATION;
		try {
			return parseDurationToMs(duration);
		} catch {
			return parseDurationToMs(DEFAULT_LOCKOUT_DURATION);
		}
	}

	/**
	 * Authenticates a user and generates PASETO tokens.
	 * Validates credentials, checks account status and lockout, and creates a new token pair.
	 * Uses timing-safe comparison to prevent email enumeration attacks.
	 * Implements failed login tracking with automatic account lockout.
	 *
	 * @param credentials - Login credentials containing email and password
	 * @returns AuthResult containing user data, access token, and refresh token
	 * @throws Error with INVALID_CREDENTIALS message if authentication fails
	 * @throws Error with ACCOUNT_LOCKED message if account is locked due to failed attempts
	 */
	async authenticate(credentials: LoginParams): Promise<AuthResult> {
		const { user, authRecord } = await this.findUserAndAuth(credentials.email);

		this.checkAccountLockout(authRecord, user?.id);

		const isValid = await this.validateCredentials(user, authRecord, credentials.password);

		if (!isValid) {
			await this.handleFailedLogin(user, authRecord);
			throw new Error(AUTH_ERRORS.INVALID_CREDENTIALS);
		}

		await this.handleSuccessfulLogin(user, authRecord);

		return this.generateTokenPair(user);
	}

	/**
	 * Finds user and their authentication record by email.
	 *
	 * @param email - User's email address
	 * @returns User and auth record, or nulls if not found
	 */
	private async findUserAndAuth(email: string): Promise<{ user: User | null; authRecord: AuthenticationData | null }> {
		const user = await this.userRepository.findByEmail(email);
		const authRecord = user ? await this.authRepository.findByUserId(user.id) : null;
		return { user, authRecord };
	}

	/**
	 * Checks if account is locked due to failed login attempts.
	 *
	 * @param authRecord - User's authentication record
	 * @param userId - User ID for logging
	 * @throws Error with ACCOUNT_LOCKED message if account is currently locked
	 */
	private checkAccountLockout(authRecord: AuthenticationData | null, userId?: number): void {
		if (authRecord?.lockedUntil && authRecord.lockedUntil > new Date()) {
			console.log(
				JSON.stringify({
					event: 'login_blocked_account_locked',
					userId,
					lockedUntil: authRecord.lockedUntil.toISOString(),
					timestamp: new Date().toISOString(),
				}),
			);
			throw new Error(AUTH_ERRORS.ACCOUNT_LOCKED);
		}
	}

	/**
	 * Validates user credentials with timing-safe comparison.
	 * Uses dummy hash when user not found to prevent timing attacks.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 * @param password - Password to verify
	 * @returns true if credentials are valid and account is active
	 */
	private async validateCredentials(
		user: User | null,
		authRecord: AuthenticationData | null,
		password: string,
	): Promise<boolean> {
		// Use dummy hash to prevent timing differences that could reveal valid emails
		const hashToCompare = authRecord?.passwordHash ?? '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummy';
		const passwordMatch = await compare(password, hashToCompare);

		return !!(user && authRecord && passwordMatch && !user.deleted && user.enabled);
	}

	/**
	 * Handles failed login attempt by tracking failures and locking account if threshold reached.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 */
	private async handleFailedLogin(user: User | null, authRecord: AuthenticationData | null): Promise<void> {
		// Only track if user exists with valid auth record and password was wrong
		if (!user || !authRecord) {
			this.logAuthFailure(user, authRecord);
			return;
		}

		const newAttemptCount = await this.authRepository.incrementFailedAttempts(user.id);

		if (newAttemptCount >= this.getMaxFailedAttempts()) {
			await this.lockUserAccount(user.id, newAttemptCount);
		}

		this.logAuthFailure(user, authRecord);
	}

	/**
	 * Locks user account after max failed attempts.
	 *
	 * @param userId - User ID to lock
	 * @param attemptCount - Number of failed attempts
	 */
	private async lockUserAccount(userId: number, attemptCount: number): Promise<void> {
		const lockDuration = this.getLockoutDuration();
		const lockedUntil = new Date(Date.now() + lockDuration);

		await this.authRepository.lockAccount(userId, lockedUntil);

		console.log(
			JSON.stringify({
				event: 'account_locked',
				userId,
				failedAttempts: attemptCount,
				lockedUntil: lockedUntil.toISOString(),
				timestamp: new Date().toISOString(),
			}),
		);
	}

	/**
	 * Logs authentication failure reasons for debugging.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 */
	private logAuthFailure(user: User | null, authRecord: AuthenticationData | null): void {
		if (!user) {
			console.error(AUTH_ERRORS.USER_NOT_FOUND);
		} else if (!authRecord) {
			console.error(AUTH_ERRORS.AUTH_RECORD_NOT_FOUND);
		} else if (user.deleted) {
			console.error(AUTH_ERRORS.ACCOUNT_DELETED);
		} else if (!user.enabled) {
			console.error(AUTH_ERRORS.ACCOUNT_DISABLED);
		} else {
			console.error(AUTH_ERRORS.INVALID_CREDENTIALS);
		}
	}

	/**
	 * Handles successful login by resetting failed attempts and cleaning up expired tokens.
	 *
	 * @param user - Authenticated user
	 * @param authRecord - User's authentication record
	 */
	private async handleSuccessfulLogin(user: User, authRecord: AuthenticationData): Promise<void> {
		if (authRecord.failedLoginAttempts > 0) {
			await this.authRepository.resetFailedAttempts(user.id);
		}

		await this.refreshTokenRepository.deleteExpiredTokensForUser(user.id);
	}

	/**
	 * Generates access and refresh token pair for authenticated user.
	 *
	 * @param user - Authenticated user
	 * @returns AuthResult with user data and tokens
	 */
	private async generateTokenPair(user: User): Promise<AuthResult> {
		const accessToken = await this.pasetoService.generateAccessToken({
			sub: user.id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		});

		const tokenFamily = crypto.randomUUID();
		const refreshToken = await this.pasetoService.generateRefreshToken(user.id.toString(), tokenFamily);

		const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
		await this.refreshTokenRepository.create({
			userId: user.id,
			tokenFamily,
			tokenHash: refreshTokenHash,
			expiresAt: this.getRefreshTokenExpiry(),
		});

		return {
			user,
			token: accessToken,
			refreshToken,
		};
	}

	/**
	 * Exchanges a refresh token for a new access/refresh token pair.
	 * Implements token rotation: the old refresh token is revoked and a new one is issued.
	 * Validates token signature, expiration, revocation status, and user account status.
	 *
	 * @param token - The refresh token to exchange
	 * @returns InternalRefreshResponse containing new access token and refresh token
	 * @throws Error if token is invalid, expired, revoked, or user account is disabled
	 */
	async refreshToken(token: string): Promise<InternalRefreshResponse> {
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
	 * Logs out a user by revoking all their refresh tokens.
	 * Also cleans up any expired tokens for the user.
	 *
	 * @param userId - The user's primary key
	 */
	async logout(userId: number): Promise<void> {
		// Revoke all refresh tokens for this user
		await this.refreshTokenRepository.revokeAllForUser(userId);

		// Delete all expired tokens for this user
		await this.refreshTokenRepository.deleteExpiredTokensForUser(userId);
	}

	/**
	 * Deletes all expired refresh tokens from the database.
	 * Uses PostgreSQL advisory lock to prevent concurrent executions across multiple server instances.
	 * Called by cron jobs and the manual cleanup endpoint.
	 *
	 * @returns CleanupResult with deleted count and incomplete flag, or null if skipped
	 *          due to concurrent execution or lock acquisition failure
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
