import type { UserStatus } from '@contracts/user/user.constants'
import type { AuthUser } from '@contracts/user/user.types'
import type { DrizzleTransaction } from '../../helpers/drizzle-postgres-connector'

export interface AuthenticationData {
	id: number
	userId: number
	passwordHash: string
	failedLoginAttempts: number
	lockedUntil: Date | null
	mustChangePassword: boolean
}

/**
 * Result from incrementing failed attempts and optionally locking account.
 */
export interface IncrementAttemptsResult {
	/** The new failed attempts count after incrementing */
	failedAttempts: number
	/** True if account was locked due to reaching threshold */
	wasLocked: boolean
	/** Timestamp when lockout expires (only set if wasLocked is true) */
	lockedUntil?: Date
}

/**
 * Parameters for inserting the initial authentication row of a newly-created user.
 */
export interface CreateInitialPasswordParams {
	userId: number
	passwordHash: string
	mustChangePassword: boolean
}

export interface AuthenticationRepository {
	findByUserId(userId: number): Promise<AuthenticationData | null>
	incrementFailedAttempts(userId: number): Promise<number>
	lockAccount(userId: number, lockedUntil: Date): Promise<void>
	resetFailedAttempts(userId: number): Promise<void>
	incrementAndLockIfNeeded(userId: number): Promise<IncrementAttemptsResult>
	/**
	 * Inserts the initial authentication row for a newly-created user.
	 * Accepts an optional `tx` so the caller can compose this write into a
	 * single transaction spanning the user, auth, and role tables.
	 */
	createInitialPassword(params: CreateInitialPasswordParams, tx?: DrizzleTransaction): Promise<void>
	/**
	 * Replaces a user's password hash and sets the must-change-password flag.
	 * Skips deleted users (joined check on the `user` table).
	 * @returns true if updated, false if the user does not exist or is deleted
	 */
	setPassword(
		userId: number,
		passwordHash: string,
		mustChangePassword: boolean,
		tx?: DrizzleTransaction,
	): Promise<boolean>
}

export interface RefreshTokenData {
	id: number
	userId: number
	tokenFamily: string
	tokenHash: string
	expiresAt: Date
	isRevoked: boolean
	createdAt: Date | null
	revokedAt: Date | null
}

/**
 * Subset of user fields returned by the joined token-user query.
 */
export interface RefreshTokenUserProfile {
	id: number
	email: string
	firstName: string
	lastName: string
	status: UserStatus
}

/**
 * Joined result from findByTokenHashWithUser — token data plus the owning user's profile.
 * Eliminates the need for a separate user lookup during token refresh.
 */
export interface RefreshTokenWithUser {
	token: RefreshTokenData
	user: RefreshTokenUserProfile
}

export interface CreateRefreshTokenParams {
	userId: number
	tokenFamily: string
	tokenHash: string
	expiresAt: Date
}

/**
 * Result from bulk expired token cleanup operation.
 */
export interface CleanupResult {
	/** Number of tokens deleted */
	deletedCount: number
	/** True if cleanup hit the max batch limit and more expired tokens may remain */
	incomplete: boolean
}

export interface RefreshTokenRepository {
	findByTokenHashWithUser(tokenHash: string): Promise<RefreshTokenWithUser | null>
	create(params: CreateRefreshTokenParams): Promise<RefreshTokenData>
	revokeToken(tokenId: number): Promise<void>
	revokeAllForUser(userId: number): Promise<void>
	revokeTokenFamily(tokenFamily: string): Promise<void>
	deleteExpiredTokensForUser(userId: number): Promise<number>
	tryAcquireCleanupLock(): Promise<boolean>
	releaseCleanupLock(): Promise<void>
	deleteAllExpiredTokens(): Promise<CleanupResult>
}

// ============================================================================
// Auth Service Types & Interface
// ============================================================================

/**
 * Credentials for user authentication.
 */
export interface AuthCredentials {
	email: string
	password: string
}

/**
 * Complete authentication result from the service layer.
 * The controller sets both `token` and `refreshToken` as HttpOnly cookies
 * and returns `user` and `mustChangePassword` in the HTTP response body.
 */
export interface AuthResult {
	user: AuthUser
	mustChangePassword: boolean
	token: string
	refreshToken: string
}

/**
 * Result from token refresh operation.
 * The controller sets both `token` and `refreshToken` as HttpOnly cookies.
 * The HTTP response body is empty.
 */
export interface RefreshResult {
	token: string
	refreshToken: string
}

/**
 * Service interface for authentication operations: login, logout, and token refresh.
 */
export interface AuthService {
	authenticate(credentials: AuthCredentials): Promise<AuthResult>
	refreshToken(token: string): Promise<RefreshResult>
	logout(userId: number): Promise<void>
}

/**
 * Service interface for token maintenance operations.
 * Separated from AuthService per Interface Segregation Principle:
 * consumers like cron jobs and the cleanup endpoint only need this method,
 * not the full authentication surface.
 *
 * Future token maintenance operations (e.g., bulk revocation) should be
 * added here rather than to AuthService.
 */
export interface TokenMaintenanceService {
	cleanupExpiredTokens(): Promise<CleanupResult | null>
}
