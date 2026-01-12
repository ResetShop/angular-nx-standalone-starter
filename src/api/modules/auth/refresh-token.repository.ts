import { and, eq, inArray, lt, sql } from 'drizzle-orm';
import { refreshToken } from '../../../db/schema/refresh-token';
import { BaseRepository } from '../../helpers/base.repository';
import { type CreateRefreshTokenParams, type IRefreshTokenRepository, type RefreshTokenData } from './interfaces';

const DELETE_BATCH_SIZE = 1000;
const MAX_CLEANUP_BATCHES = 100; // Limit cleanup to 100k tokens per run to prevent indefinite execution

// Advisory lock key for token cleanup
// Using a hash-like number derived from 'refresh_token_cleanup' to avoid collisions
// with other advisory locks in the same database
const TOKEN_CLEANUP_LOCK_KEY = 0x5246544b; // "RFTK" in hex (Refresh Token Cleanup Key)

export class RefreshTokenRepository extends BaseRepository implements IRefreshTokenRepository {
	/**
	 * Try to acquire a PostgreSQL advisory lock for token cleanup.
	 * Non-blocking - returns immediately with true/false.
	 * Works across multiple server instances sharing the same database.
	 * @returns true if lock acquired, false if already locked by another process
	 */
	async tryAcquireCleanupLock(): Promise<boolean> {
		const result = await this.db.execute(sql`SELECT pg_try_advisory_lock(${TOKEN_CLEANUP_LOCK_KEY}) as locked`);
		const row = result.rows[0] as { locked: boolean | null | undefined } | undefined;
		if (!row || typeof row.locked !== 'boolean') {
			throw new Error('Failed to acquire advisory lock: unexpected result format');
		}
		return row.locked;
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
	 * Limited to MAX_CLEANUP_BATCHES iterations to prevent indefinite execution.
	 * @returns Count of deleted tokens
	 */
	async deleteAllExpiredTokens(): Promise<number> {
		let totalDeleted = 0;
		let batchCount = 0;

		while (batchCount < MAX_CLEANUP_BATCHES) {
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
			batchCount++;

			// If we got fewer than batch size, we're done
			if (expiredBatch.length < DELETE_BATCH_SIZE) {
				break;
			}
		}

		if (batchCount >= MAX_CLEANUP_BATCHES) {
			console.warn(`[TokenCleanup] Reached max batch limit (${MAX_CLEANUP_BATCHES}). Some expired tokens may remain.`);
		}

		return totalDeleted;
	}
}
