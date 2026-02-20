import { AuthError, InternalAuthErrorCode, getInternalErrorMessage } from '@contracts/auth/auth.errors';
import { compare } from 'bcryptjs';
import { createHash, randomUUID } from 'crypto';
import { type IPasetoService } from '../../services/paseto/interfaces';
import { parseDurationToMs } from '../../utils/duration';
import { type IUserRepository, type UserData } from '../user/interfaces';
import {
	type AuthCredentials,
	type AuthResult,
	type AuthenticationData,
	type CleanupResult,
	type IAuthService,
	type IAuthenticationRepository,
	type IRefreshTokenRepository,
	type RefreshResult,
} from './interfaces';

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
export class AuthService implements IAuthService {
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
	 * Authenticates a user and generates PASETO tokens.
	 * Validates credentials, checks account status and lockout, and creates a new token pair.
	 * Uses timing-safe comparison to prevent email enumeration attacks.
	 * Implements failed login tracking with automatic account lockout.
	 *
	 * @param credentials - Login credentials containing email and password
	 * @returns AuthResult containing user data, access token, and refresh token
	 * @throws AuthError with INVALID_CREDENTIALS code if authentication fails
	 * @throws AuthError with ACCOUNT_LOCKED code if account is locked due to failed attempts
	 */
	async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
		return this.findUserAndAuth(credentials.email)
			.then(({ user, authRecord }) => {
				this.checkAccountLockout(authRecord, user?.id);
				return this.validateCredentials(user, authRecord, credentials.password);
			})
			.then(({ user, authRecord }) =>
				this.handleSuccessfulLogin(user, authRecord).then(() => ({
					user,
					mustChangePassword: authRecord.mustChangePassword,
				})),
			)
			.then(({ user, mustChangePassword }) =>
				this.generateTokenPair(user).then((tokens) => ({
					...tokens,
					user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
					mustChangePassword,
				})),
			);
	}

	/**
	 * Finds user and their authentication record by email.
	 *
	 * SECURITY: Returns nullable values instead of throwing to prevent timing attacks.
	 * If this method threw on user-not-found, attackers could enumerate valid emails
	 * by measuring response times. By always returning (with nulls when not found),
	 * we ensure validateCredentials() always performs password comparison (using a
	 * dummy hash for non-existent users), making all authentication attempts take
	 * similar time regardless of whether the email exists.
	 *
	 * @param email - User's email address
	 * @returns User and auth record, or nulls if not found
	 */
	private async findUserAndAuth(
		email: string,
	): Promise<{ user: UserData | null; authRecord: AuthenticationData | null }> {
		const user = await this.userRepository.findByEmail(email);
		const authRecord = user ? await this.authRepository.findByUserId(user.id) : null;
		return { user, authRecord };
	}

	/**
	 * Checks if account is locked due to failed login attempts.
	 *
	 * @param authRecord - User's authentication record
	 * @param userId - User ID for logging
	 * @throws AuthError with ACCOUNT_LOCKED code if account is currently locked
	 */
	private checkAccountLockout(authRecord: AuthenticationData | null, userId?: number): void {
		if (authRecord?.lockedUntil && authRecord.lockedUntil > new Date()) {
			// TODO(#66): Replace with structured logging service
			console.log(
				JSON.stringify({
					event: 'login_blocked_account_locked',
					userId,
					lockedUntil: authRecord.lockedUntil.toISOString(),
					timestamp: new Date().toISOString(),
				}),
			);
			throw new AuthError(InternalAuthErrorCode.ACCOUNT_LOCKED);
		}
	}

	/**
	 * Validates user credentials with timing-safe comparison.
	 *
	 * SECURITY: Accepts nullable parameters to maintain timing-safety. Even when user
	 * or authRecord is null (invalid email), we MUST perform the expensive bcrypt
	 * password comparison using a dummy hash. Skipping bcrypt for invalid cases would
	 * create a timing vulnerability: valid emails take ~200ms (DB + bcrypt), invalid
	 * emails take ~50ms (DB only), allowing attackers to enumerate valid emails by
	 * measuring response times. The cost is intentional and necessary for security.
	 *
	 * Handles failed login tracking before throwing.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 * @param password - Password to verify
	 * @returns Validated user and auth record
	 * @throws AuthError with INVALID_CREDENTIALS code if validation fails
	 */
	private async validateCredentials(
		user: UserData | null,
		authRecord: AuthenticationData | null,
		password: string,
	): Promise<{ user: UserData; authRecord: AuthenticationData }> {
		const hashToCompare = authRecord?.passwordHash ?? '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummy';
		const passwordMatch = await compare(password, hashToCompare);

		if (!user || !authRecord || !passwordMatch || user.deleted || !user.enabled) {
			await this.handleFailedLogin(user, authRecord);
			throw new AuthError(InternalAuthErrorCode.INVALID_CREDENTIALS);
		}

		return { user, authRecord };
	}

	/**
	 * Handles failed login attempt by tracking failures and locking account if threshold reached.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 */
	private async handleFailedLogin(user: UserData | null, authRecord: AuthenticationData | null): Promise<void> {
		if (!user || !authRecord) {
			this.logAuthFailure(user, authRecord);
			return;
		}

		const result = await this.authRepository.incrementAndLockIfNeeded(user.id);

		if (result.wasLocked && result.lockedUntil) {
			// TODO(#66): Replace with structured logging service
			console.log(
				JSON.stringify({
					event: 'account_locked',
					userId: user.id,
					failedAttempts: result.failedAttempts,
					lockedUntil: result.lockedUntil.toISOString(),
					timestamp: new Date().toISOString(),
				}),
			);
		}

		this.logAuthFailure(user, authRecord);
	}

	/**
	 * Logs authentication failure reasons for debugging.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 */
	// TODO(#66): Replace with structured logging service
	private logAuthFailure(user: UserData | null, authRecord: AuthenticationData | null): void {
		if (!user) {
			console.error(getInternalErrorMessage(InternalAuthErrorCode.USER_NOT_FOUND));
		} else if (!authRecord) {
			console.error(getInternalErrorMessage(InternalAuthErrorCode.AUTH_RECORD_NOT_FOUND));
		} else if (user.deleted) {
			console.error(getInternalErrorMessage(InternalAuthErrorCode.ACCOUNT_DELETED));
		} else if (!user.enabled) {
			console.error(getInternalErrorMessage(InternalAuthErrorCode.ACCOUNT_DISABLED));
		} else {
			console.error(getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS));
		}
	}

	/**
	 * Handles successful login by resetting failed attempts and cleaning up expired tokens.
	 *
	 * @param user - Authenticated user
	 * @param authRecord - User's authentication record
	 */
	private async handleSuccessfulLogin(user: UserData, authRecord: AuthenticationData): Promise<void> {
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
	private async generateTokenPair(user: UserData): Promise<{ token: string; refreshToken: string }> {
		const accessToken = await this.pasetoService.generateAccessToken({
			sub: user.id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		});

		const tokenFamily = randomUUID();
		const refreshToken = await this.pasetoService.generateRefreshToken(user.id.toString(), tokenFamily);

		const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
		await this.refreshTokenRepository.create({
			userId: user.id,
			tokenFamily,
			tokenHash: refreshTokenHash,
			expiresAt: this.getRefreshTokenExpiry(),
		});

		return {
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
	 * @returns RefreshResult containing new access token and refresh token
	 * @throws AuthError if token is invalid, expired, revoked, or user account is disabled
	 */
	async refreshToken(token: string): Promise<RefreshResult> {
		// 1. Verify refresh token
		const payload = await this.pasetoService.verifyRefreshToken(token);

		// 2. Validate token family exists (required for rotation tracking)
		if (!payload.tokenFamily) {
			throw new AuthError(InternalAuthErrorCode.TOKEN_MISSING_FAMILY);
		}

		// 3. Check if token is revoked in database
		const tokenHash = createHash('sha256').update(token).digest('hex');
		const storedToken = await this.refreshTokenRepository.findByTokenHash(tokenHash);

		if (!storedToken || storedToken.isRevoked) {
			throw new AuthError(InternalAuthErrorCode.TOKEN_REVOKED);
		}

		// 4. Check if token is expired
		if (storedToken.expiresAt < new Date()) {
			throw new AuthError(InternalAuthErrorCode.REFRESH_TOKEN_EXPIRED);
		}

		// 5. Get user data and validate account status
		const user = await this.userRepository.findById(Number(payload.sub));
		if (!user || user.deleted) {
			throw new AuthError(InternalAuthErrorCode.USER_NOT_FOUND);
		}

		if (!user.enabled) {
			throw new AuthError(InternalAuthErrorCode.ACCOUNT_DISABLED);
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
			// TODO(#66): Replace with structured logging service
			console.error('[TokenCleanup] Failed to acquire advisory lock:', error);
			return null;
		}

		if (!lockAcquired) {
			// TODO(#66): Replace with structured logging service
			console.log('[TokenCleanup] Skipped - cleanup already in progress (another instance holds the lock)');
			return null;
		}

		try {
			const startTime = Date.now();
			const result = await this.refreshTokenRepository.deleteAllExpiredTokens();
			const durationMs = Date.now() - startTime;

			// TODO(#66): Replace with structured logging service
			console.log(
				JSON.stringify({
					event: 'token_cleanup',
					deletedCount: result.deletedCount,
					durationMs,
					incomplete: result.incomplete,
					timestamp: new Date().toISOString(),
				}),
			);

			// TODO(#66): Replace with structured logging service
			console.log(`[TokenCleanup] Deleted ${result.deletedCount} expired tokens in ${durationMs}ms`);
			if (result.incomplete) {
				console.warn('[TokenCleanup] Cleanup was incomplete - more expired tokens may remain');
			}
			return result;
		} finally {
			try {
				await this.refreshTokenRepository.releaseCleanupLock();
			} catch (error) {
				// TODO(#66): Replace with structured logging service
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
