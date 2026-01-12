export interface AuthenticationData {
	passwordHash: string;
}

export interface IAuthenticationRepository {
	findByUserId(userId: number): Promise<AuthenticationData | null>;
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
