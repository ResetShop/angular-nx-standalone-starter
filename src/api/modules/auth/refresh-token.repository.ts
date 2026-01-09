import { and, eq, lt } from 'drizzle-orm';
import { refreshToken } from '../../../db/schema/refresh-token';
import { BaseRepository } from '../../helpers/base.repository';

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
}
