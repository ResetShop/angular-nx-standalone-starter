import { AuthError, InternalAuthErrorCode, getInternalErrorMessage } from '@contracts/auth/auth.errors'
import { UserStatus } from '@contracts/user/user.constants'
import { parseDurationToMs } from '@utils/duration'
import { logger } from '@utils/logger'
import { compare } from 'bcryptjs'
import { createHash, randomUUID } from 'crypto'
import { type PasetoService } from '../../services/paseto/interfaces'
import { type UserData, type UserRepository } from '../user/interfaces'
import type { AuthConfig } from './auth.config'
import {
	type AuthCredentials,
	type AuthResult,
	type AuthService as AuthServiceInterface,
	type AuthenticationData,
	type AuthenticationRepository,
	type CleanupResult,
	type RefreshResult,
	type RefreshTokenRepository,
	type TokenMaintenanceService,
} from './interfaces'

interface AuthServiceDeps {
	userRepository: UserRepository
	authRepository: AuthenticationRepository
	refreshTokenRepository: RefreshTokenRepository
	pasetoService: PasetoService
	authConfig: AuthConfig
}

/**
 * Service for user authentication and token management.
 * Handles login, logout, token refresh, and expired token cleanup.
 * Uses PASETO tokens for secure, stateless authentication with refresh token rotation.
 */
export class AuthService implements AuthServiceInterface, TokenMaintenanceService {
	private readonly userRepository: UserRepository
	private readonly authRepository: AuthenticationRepository
	private readonly refreshTokenRepository: RefreshTokenRepository
	private readonly pasetoService: PasetoService
	private readonly authConfig: AuthConfig

	constructor({ userRepository, authRepository, refreshTokenRepository, pasetoService, authConfig }: AuthServiceDeps) {
		this.userRepository = userRepository
		this.authRepository = authRepository
		this.refreshTokenRepository = refreshTokenRepository
		this.pasetoService = pasetoService
		this.authConfig = authConfig
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
	public async authenticate(credentials: AuthCredentials): Promise<AuthResult> {
		const { user, authRecord } = await this.findUserAndAuth(credentials.email)
		this.checkAccountLockout(authRecord, user?.id)

		const validated = await this.validateCredentials(user, authRecord, credentials.password)
		await this.handleSuccessfulLogin(validated.user, validated.authRecord)

		const tokens = await this.generateTokenPair(validated.user)

		return {
			...tokens,
			user: {
				id: validated.user.id,
				email: validated.user.email,
				firstName: validated.user.firstName,
				lastName: validated.user.lastName,
			},
			mustChangePassword: validated.authRecord.mustChangePassword,
		}
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
		const user = await this.userRepository.findByEmail(email)
		const authRecord = user ? await this.authRepository.findByUserId(user.id) : null
		return { user, authRecord }
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
			logger.security('login_blocked_account_locked', { userId, lockedUntil: authRecord.lockedUntil.toISOString() })
			throw new AuthError(InternalAuthErrorCode.ACCOUNT_LOCKED)
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
		const hashToCompare = authRecord?.passwordHash ?? '$2a$10$dummyhashdummyhashdummyhashdummyhashdummyhashdummy'
		const passwordMatch = await compare(password, hashToCompare)

		if (!user || !authRecord || !passwordMatch || user.status !== UserStatus.ACTIVE) {
			await this.handleFailedLogin(user, authRecord)
			throw new AuthError(InternalAuthErrorCode.INVALID_CREDENTIALS)
		}

		return { user, authRecord }
	}

	/**
	 * Handles failed login attempt by tracking failures and locking account if threshold reached.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 */
	private async handleFailedLogin(user: UserData | null, authRecord: AuthenticationData | null): Promise<void> {
		if (!user || !authRecord) {
			this.logAuthFailure(user, authRecord)
			return
		}

		const result = await this.authRepository.incrementAndLockIfNeeded(user.id)

		if (result.wasLocked && result.lockedUntil) {
			logger.security('account_locked', {
				userId: user.id,
				failedAttempts: result.failedAttempts,
				lockedUntil: result.lockedUntil.toISOString(),
			})
		}

		this.logAuthFailure(user, authRecord)
	}

	/**
	 * Logs authentication failure reasons for debugging.
	 *
	 * @param user - User object or null
	 * @param authRecord - Authentication record or null
	 */
	private logAuthFailure(user: UserData | null, authRecord: AuthenticationData | null): void {
		if (!user) {
			logger.error('AuthService', getInternalErrorMessage(InternalAuthErrorCode.USER_NOT_FOUND))
		} else if (!authRecord) {
			logger.error('AuthService', getInternalErrorMessage(InternalAuthErrorCode.AUTH_RECORD_NOT_FOUND))
		} else if (user.status === UserStatus.DELETED) {
			logger.error('AuthService', getInternalErrorMessage(InternalAuthErrorCode.ACCOUNT_DELETED))
		} else if (user.status === UserStatus.DISABLED) {
			logger.error('AuthService', getInternalErrorMessage(InternalAuthErrorCode.ACCOUNT_DISABLED))
		} else {
			logger.error('AuthService', getInternalErrorMessage(InternalAuthErrorCode.INVALID_CREDENTIALS))
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
			await this.authRepository.resetFailedAttempts(user.id)
		}

		await this.refreshTokenRepository.deleteExpiredTokensForUser(user.id)
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
		})

		const tokenFamily = randomUUID()
		const refreshToken = await this.pasetoService.generateRefreshToken(user.id.toString(), tokenFamily)

		const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex')
		await this.refreshTokenRepository.create({
			userId: user.id,
			tokenFamily,
			tokenHash: refreshTokenHash,
			expiresAt: new Date(Date.now() + parseDurationToMs(this.authConfig.refreshTokenExpiry)),
		})

		return {
			token: accessToken,
			refreshToken,
		}
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
	public async refreshToken(token: string): Promise<RefreshResult> {
		// 1. Verify refresh token
		const payload = await this.pasetoService.verifyRefreshToken(token)

		// 2. Validate token family exists (required for rotation tracking)
		if (!payload.tokenFamily) {
			throw new AuthError(InternalAuthErrorCode.TOKEN_MISSING_FAMILY)
		}

		// 3. Find token and user in a single joined query (reduces 2 sequential queries to 1)
		const tokenHash = createHash('sha256').update(token).digest('hex')
		const result = await this.refreshTokenRepository.findByTokenHashWithUser(tokenHash)

		// Treat missing tokens as revoked — covers garbage-collected, never-stored, or deleted token cases
		if (!result) {
			throw new AuthError(InternalAuthErrorCode.TOKEN_REVOKED)
		}

		const { token: storedToken, user } = result

		// 4. Check if token is expired (before reuse detection, so expired+revoked tokens
		// don't trigger family revocation — expiry is the expected lifecycle outcome)
		if (storedToken.expiresAt < new Date()) {
			throw new AuthError(InternalAuthErrorCode.REFRESH_TOKEN_EXPIRED)
		}

		// 5. Token reuse detection: if a non-expired revoked token is replayed, an attacker
		// may have stolen it. Revoke the entire token family to protect the user.
		if (storedToken.isRevoked) {
			logger.security('token_reuse_detected', { userId: storedToken.userId, tokenFamily: storedToken.tokenFamily })
			try {
				await this.refreshTokenRepository.revokeTokenFamily(storedToken.tokenFamily)
			} catch (error) {
				logger.error('TokenReuse', 'Failed to revoke token family', error)
			}
			throw new AuthError(InternalAuthErrorCode.TOKEN_REUSE_DETECTED)
		}

		// 6. Validate account status (user data already fetched via joined query)
		if (user.status === UserStatus.DELETED) {
			throw new AuthError(InternalAuthErrorCode.USER_NOT_FOUND)
		}

		if (user.status !== UserStatus.ACTIVE) {
			throw new AuthError(InternalAuthErrorCode.ACCOUNT_DISABLED)
		}

		// 7. Generate new tokens
		const newAccessToken = await this.pasetoService.generateAccessToken({
			sub: user.id.toString(),
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
		})

		const newRefreshToken = await this.pasetoService.generateRefreshToken(
			user.id.toString(),
			payload.tokenFamily, // Maintain token family for rotation
		)

		// 8. Revoke old refresh token
		await this.refreshTokenRepository.revokeToken(storedToken.id)

		// 9. Store new refresh token
		const newTokenHash = createHash('sha256').update(newRefreshToken).digest('hex')
		await this.refreshTokenRepository.create({
			userId: user.id,
			tokenFamily: payload.tokenFamily,
			tokenHash: newTokenHash,
			expiresAt: new Date(Date.now() + parseDurationToMs(this.authConfig.refreshTokenExpiry)),
		})

		return {
			token: newAccessToken,
			refreshToken: newRefreshToken,
		}
	}

	/**
	 * Logs out a user by revoking all their refresh tokens.
	 * Also cleans up any expired tokens for the user.
	 *
	 * @param userId - The user's primary key
	 */
	public async logout(userId: number): Promise<void> {
		// Revoke all refresh tokens for this user
		await this.refreshTokenRepository.revokeAllForUser(userId)

		// Delete all expired tokens for this user
		await this.refreshTokenRepository.deleteExpiredTokensForUser(userId)
	}

	/**
	 * Deletes all expired refresh tokens from the database.
	 * Uses PostgreSQL advisory lock to prevent concurrent executions across multiple server instances.
	 * Called by cron jobs and the manual cleanup endpoint.
	 *
	 * @returns CleanupResult with deleted count and incomplete flag, or null if skipped
	 *          due to concurrent execution or lock acquisition failure
	 */
	public async cleanupExpiredTokens(): Promise<CleanupResult | null> {
		// Try to acquire database-level lock (works across multiple server instances)
		let lockAcquired = false
		try {
			lockAcquired = await this.refreshTokenRepository.tryAcquireCleanupLock()
		} catch (error) {
			logger.error('TokenCleanup', 'Failed to acquire advisory lock', error)
			return null
		}

		if (!lockAcquired) {
			logger.info('TokenCleanup', 'Skipped - cleanup already in progress (another instance holds the lock)')
			return null
		}

		try {
			const startTime = Date.now()
			const result = await this.refreshTokenRepository.deleteAllExpiredTokens()
			const durationMs = Date.now() - startTime

			logger.security('token_cleanup', { deletedCount: result.deletedCount, durationMs, incomplete: result.incomplete })
			logger.info('TokenCleanup', `Deleted ${result.deletedCount} expired tokens in ${durationMs}ms`)
			if (result.incomplete) {
				logger.warn('TokenCleanup', 'Cleanup was incomplete - more expired tokens may remain')
			}
			return result
		} finally {
			try {
				await this.refreshTokenRepository.releaseCleanupLock()
			} catch (error) {
				// PostgreSQL session advisory locks are automatically released when the
				// database session/connection ends — the lock won't persist indefinitely.
				logger.error(
					'TokenCleanup',
					'Failed to release advisory lock. Lock will auto-release when DB session ends',
					error,
				)
			}
		}
	}
}
