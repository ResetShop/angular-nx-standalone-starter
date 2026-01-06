import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { refreshToken } from '../../../db/schema/refresh-token';
import { BaseRepository } from '../../helpers/base.repository';

const DELETE_BATCH_SIZE = 1000;

// Advisory lock key for token cleanup (arbitrary unique number)
const TOKEN_CLEANUP_LOCK_KEY = 123456789;

interface RefreshTokenData {
	id: number;
	userId: number;
	tokenFamily: string;
	tokenHash: string;
	expiresAt: Date;
	isRevoked: boolean | null;
	createdAt: Date | null;
	revokedAt: Date | null;
}

interface CreateRefreshTokenParams {
	userId: number;
	tokenFamily: string;
	tokenHash: string;
	expiresAt: Date;
}

export class RefreshTokenRepository extends BaseRepository {
	/**
	 * Try to acquire a PostgreSQL advisory lock for token cleanup.
	 * Non-blocking - returns immediately with true/false.
	 * Works across multiple server instances sharing the same database.
	 * @returns true if lock acquired, false if already locked by another process
	 */
	async tryAcquireCleanupLock(): Promise<boolean> {
		const result = await this.db.execute(sql`SELECT pg_try_advisory_lock(${TOKEN_CLEANUP_LOCK_KEY}) as locked`);
		return (result.rows[0] as { locked: boolean }).locked;
	}

	/**
	 * Release the PostgreSQL advisory lock for token cleanup.
	 */
	async releaseCleanupLock(): Promise<void> {
		await this.db.execute(sql`SELECT pg_advisory_unlock(${TOKEN_CLEANUP_LOCK_KEY})`);
	}

	/**
	 * Find refresh token by its hash
	 * @param tokenHash Hash of the token to find. This is the token itself, not the ID.
	 */
	async findByTokenHash(tokenHash: string): Promise<RefreshTokenData | null> {
		const result = await this.db.select().from(refreshToken).where(eq(refreshToken.tokenHash, tokenHash)).limit(1);

		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Create a new refresh token
	 * @param params Parameters for the new token. See the CreateRefreshTokenParams interface for details.
	 */
	async create(params: CreateRefreshTokenParams): Promise<RefreshTokenData> {
		const result = await this.db
			.insert(refreshToken)
			.values({
				userId: params.userId,
				tokenFamily: params.tokenFamily,
				tokenHash: params.tokenHash,
				expiresAt: params.expiresAt,
			})
			.returning();

		return result[0];
	}

	/**
	 * Revoke a specific refresh token
	 * @param tokenId of the token to revoke
	 */
	async revokeToken(tokenId: number): Promise<void> {
		await this.db
			.update(refreshToken)
			.set({
				isRevoked: true,
				revokedAt: new Date(),
			})
			.where(eq(refreshToken.id, tokenId));
	}

	/**
	 * Revoke all refresh tokens for a user (for logout)
	 * @param userId User ID to revoke tokens for
	 */
	async revokeAllForUser(userId: number): Promise<void> {
		await this.db
			.update(refreshToken)
			.set({
				isRevoked: true,
				revokedAt: new Date(),
			})
			.where(eq(refreshToken.userId, userId));
	}

	/**
	 * Delete all expired refresh tokens for a user
	 * @param userId User ID to delete expired tokens for
	 * @returns Count of deleted tokens
	 */
	async deleteExpiredTokensForUser(userId: number): Promise<number> {
		const result = await this.db
			.delete(refreshToken)
			.where(and(eq(refreshToken.userId, userId), lt(refreshToken.expiresAt, new Date())))
			.returning({ id: refreshToken.id });

		return result.length;
	}

	/**
	 * Delete all expired refresh tokens globally.
	 * Uses batch deletion to avoid locking the table for large datasets.
	 * @returns Count of deleted tokens
	 */
	async deleteAllExpiredTokens(): Promise<number> {
		let totalDeleted = 0;

		while (true) {
			// Select a batch of expired token IDs
			const expiredBatch = await this.db
				.select({ id: refreshToken.id })
				.from(refreshToken)
				.where(lt(refreshToken.expiresAt, new Date()))
				.limit(DELETE_BATCH_SIZE);

			if (!expiredBatch || expiredBatch.length === 0) {
				break;
			}

			// Delete the batch by IDs
			const idsToDelete = expiredBatch.map((t) => t.id);
			await this.db.delete(refreshToken).where(inArray(refreshToken.id, idsToDelete));

			totalDeleted += expiredBatch.length;

			// If we got fewer than batch size, we're done
			if (expiredBatch.length < DELETE_BATCH_SIZE) {
				break;
			}
		}

		return totalDeleted;
	}
}
