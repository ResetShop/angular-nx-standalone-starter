import {
	type CleanupResult,
	type CreateRefreshTokenParams,
	type IRefreshTokenRepository,
	type RefreshTokenData,
} from './interfaces';

export class MockRefreshTokenRepository implements IRefreshTokenRepository {
	private tokens: Map<string, RefreshTokenData> = new Map();
	private tokensById: Map<number, RefreshTokenData> = new Map();
	private tokenIdCounter = 1;

	// Track method calls for assertions
	public revokedTokenIds: number[] = [];
	public revokedUserIds: number[] = [];
	public deletedExpiredForUsers: number[] = [];
	public createdTokens: RefreshTokenData[] = [];
	public cleanupLockAcquired = false;
	public deleteAllExpiredCalled = false;

	/**
	 * Add a token to the mock repository.
	 * @param tokenHash Hash of the token
	 * @param data Partial token data (defaults will be applied)
	 * @returns The created token data
	 */
	addToken(tokenHash: string, data: Partial<RefreshTokenData> = {}): RefreshTokenData {
		const token: RefreshTokenData = {
			id: data.id ?? this.tokenIdCounter++,
			userId: data.userId ?? 1,
			tokenFamily: data.tokenFamily ?? 'test-family',
			tokenHash,
			expiresAt: data.expiresAt ?? new Date(Date.now() + 86400000),
			isRevoked: data.isRevoked ?? false,
			createdAt: data.createdAt ?? new Date(),
			revokedAt: data.revokedAt ?? null,
		};
		this.tokens.set(tokenHash, token);
		this.tokensById.set(token.id, token);
		return token;
	}

	/**
	 * Clear all tokens and reset tracking arrays.
	 */
	clear(): void {
		this.tokens.clear();
		this.tokensById.clear();
		this.revokedTokenIds = [];
		this.revokedUserIds = [];
		this.deletedExpiredForUsers = [];
		this.createdTokens = [];
		this.cleanupLockAcquired = false;
		this.deleteAllExpiredCalled = false;
		this.tokenIdCounter = 1;
	}

	async findByTokenHash(tokenHash: string): Promise<RefreshTokenData | null> {
		return this.tokens.get(tokenHash) ?? null;
	}

	async create(params: CreateRefreshTokenParams): Promise<RefreshTokenData> {
		const token = this.addToken(params.tokenHash, {
			userId: params.userId,
			tokenFamily: params.tokenFamily,
			expiresAt: params.expiresAt,
		});
		this.createdTokens.push(token);
		return token;
	}

	async revokeToken(tokenId: number): Promise<void> {
		this.revokedTokenIds.push(tokenId);
		const token = this.tokensById.get(tokenId);
		if (token) {
			token.isRevoked = true;
			token.revokedAt = new Date();
		}
	}

	async revokeAllForUser(userId: number): Promise<void> {
		this.revokedUserIds.push(userId);
		for (const token of this.tokens.values()) {
			if (token.userId === userId) {
				token.isRevoked = true;
				token.revokedAt = new Date();
			}
		}
	}

	async deleteExpiredTokensForUser(userId: number): Promise<number> {
		this.deletedExpiredForUsers.push(userId);
		// Count and remove expired tokens
		let count = 0;
		const now = new Date();
		for (const [hash, token] of this.tokens.entries()) {
			if (token.userId === userId && token.expiresAt < now) {
				this.tokens.delete(hash);
				this.tokensById.delete(token.id);
				count++;
			}
		}
		return count;
	}

	async tryAcquireCleanupLock(): Promise<boolean> {
		if (this.cleanupLockAcquired) {
			return false;
		}
		this.cleanupLockAcquired = true;
		return true;
	}

	async releaseCleanupLock(): Promise<void> {
		this.cleanupLockAcquired = false;
	}

	async deleteAllExpiredTokens(): Promise<CleanupResult> {
		this.deleteAllExpiredCalled = true;
		// Count and remove all expired tokens
		let count = 0;
		const now = new Date();
		for (const [hash, token] of this.tokens.entries()) {
			if (token.expiresAt < now) {
				this.tokens.delete(hash);
				this.tokensById.delete(token.id);
				count++;
			}
		}
		return { deletedCount: count, incomplete: false };
	}
}
