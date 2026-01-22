export interface AuthenticationData {
	id: number;
	userId: number;
	passwordHash: string;
	failedLoginAttempts: number;
	lockedUntil: Date | null;
}

export interface IAuthenticationRepository {
	findByUserId(userId: number): Promise<AuthenticationData | null>;
	incrementFailedAttempts(userId: number): Promise<number>;
	lockAccount(userId: number, lockedUntil: Date): Promise<void>;
	resetFailedAttempts(userId: number): Promise<void>;
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
