import type { AuthUser } from '@contracts/users/users.types';

export interface AuthenticationData {
	id: number;
	userId: number;
	passwordHash: string;
	failedLoginAttempts: number;
	lockedUntil: Date | null;
	mustChangePassword: boolean;
}

/**
 * Result from incrementing failed attempts and optionally locking account.
 */
export interface IncrementAttemptsResult {
	/** The new failed attempts count after incrementing */
	failedAttempts: number;
	/** True if account was locked due to reaching threshold */
	wasLocked: boolean;
	/** Timestamp when lockout expires (only set if wasLocked is true) */
	lockedUntil?: Date;
}

export interface IAuthenticationRepository {
	findByUserId(userId: number): Promise<AuthenticationData | null>;
	incrementFailedAttempts(userId: number): Promise<number>;
	lockAccount(userId: number, lockedUntil: Date): Promise<void>;
	resetFailedAttempts(userId: number): Promise<void>;
	incrementAndLockIfNeeded(userId: number): Promise<IncrementAttemptsResult>;
}

export interface RefreshTokenData {
	id: number;
	userId: number;
	tokenFamily: string;
	tokenHash: string;
	expiresAt: Date;
	isRevoked: boolean | null;
	createdAt: Date | null;
	revokedAt: Date | null;
}

export interface CreateRefreshTokenParams {
	userId: number;
	tokenFamily: string;
	tokenHash: string;
	expiresAt: Date;
}

/**
 * Result from bulk expired token cleanup operation.
 */
export interface CleanupResult {
	/** Number of tokens deleted */
	deletedCount: number;
	/** True if cleanup hit the max batch limit and more expired tokens may remain */
	incomplete: boolean;
}

export interface IRefreshTokenRepository {
	findByTokenHash(tokenHash: string): Promise<RefreshTokenData | null>;
	create(params: CreateRefreshTokenParams): Promise<RefreshTokenData>;
	revokeToken(tokenId: number): Promise<void>;
	revokeAllForUser(userId: number): Promise<void>;
	deleteExpiredTokensForUser(userId: number): Promise<number>;
	tryAcquireCleanupLock(): Promise<boolean>;
	releaseCleanupLock(): Promise<void>;
	deleteAllExpiredTokens(): Promise<CleanupResult>;
}

// ============================================================================
// Auth Service Types & Interface
// ============================================================================

/**
 * Credentials for user authentication.
 */
export interface AuthCredentials {
	email: string;
	password: string;
}

/**
 * Complete authentication result from the service layer.
 * The controller sets both `token` and `refreshToken` as HttpOnly cookies
 * and returns only `user` in the HTTP response body.
 */
export interface AuthResult {
	user: AuthUser;
	mustChangePassword: boolean;
	token: string;
	refreshToken: string;
}

/**
 * Result from token refresh operation.
 * The controller sets both `token` and `refreshToken` as HttpOnly cookies.
 * The HTTP response body is empty.
 */
export interface RefreshResult {
	token: string;
	refreshToken: string;
}

/**
 * Service interface for authentication operations: login, logout, token refresh, and cleanup.
 */
export interface IAuthService {
	authenticate(credentials: AuthCredentials): Promise<AuthResult>;
	refreshToken(token: string): Promise<RefreshResult>;
	logout(userId: number): Promise<void>;
	cleanupExpiredTokens(): Promise<CleanupResult | null>;
}
