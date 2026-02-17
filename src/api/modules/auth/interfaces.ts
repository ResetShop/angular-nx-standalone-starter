export interface AuthenticationData {
	id: number;
	userId: number;
	passwordHash: string;
	failedLoginAttempts: number;
	lockedUntil: Date | null;
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

export interface IAuthService {
	authenticate(credentials: {
		email: string;
		password: string;
	}): Promise<{ user: { id: number; email: string; firstName: string; lastName: string }; token: string; refreshToken: string }>;
	refreshToken(token: string): Promise<{ token: string; refreshToken: string }>;
	logout(userId: number): Promise<void>;
	cleanupExpiredTokens(): Promise<CleanupResult | null>;
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
