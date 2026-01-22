import { eq, sql } from 'drizzle-orm';
import { authentication } from '../../../db/schema/authentication';
import { BaseRepository } from '../../helpers/base.repository';
import { type AuthenticationData, type IAuthenticationRepository } from './interfaces';

/**
 * Repository for authentication-related database operations.
 * Handles password hash storage, retrieval, and account lockout management.
 */
export class AuthenticationRepository extends BaseRepository implements IAuthenticationRepository {
	/**
	 * Finds authentication data for a user by their ID.
	 * Used during login to retrieve the stored password hash and lockout status.
	 *
	 * @param userId - The user's primary key
	 * @returns Authentication data including password hash and lockout info, or null if not found
	 */
	async findByUserId(userId: number): Promise<AuthenticationData | null> {
		const result = await this.db
			.select({
				id: authentication.id,
				userId: authentication.userId,
				passwordHash: authentication.passwordHash,
				failedLoginAttempts: authentication.failedLoginAttempts,
				lockedUntil: authentication.lockedUntil,
			})
			.from(authentication)
			.where(eq(authentication.userId, userId))
			.limit(1);

		if (result.length === 0) {
			return null;
		}

		return {
			id: result[0].id,
			userId: result[0].userId,
			passwordHash: result[0].passwordHash,
			failedLoginAttempts: result[0].failedLoginAttempts ?? 0,
			lockedUntil: result[0].lockedUntil,
		};
	}

	/**
	 * Increments the failed login attempts counter for a user.
	 * Uses atomic SQL increment to prevent race conditions.
	 *
	 * @param userId - The user's primary key
	 * @returns The new failed attempts count after incrementing
	 */
	async incrementFailedAttempts(userId: number): Promise<number> {
		const result = await this.db
			.update(authentication)
			.set({
				failedLoginAttempts: sql`COALESCE(${authentication.failedLoginAttempts}, 0) + 1`,
				updatedAt: new Date(),
			})
			.where(eq(authentication.userId, userId))
			.returning({ failedLoginAttempts: authentication.failedLoginAttempts });

		return result[0]?.failedLoginAttempts ?? 1;
	}

	/**
	 * Locks a user's account until the specified time.
	 * Called when max failed attempts threshold is reached.
	 *
	 * @param userId - The user's primary key
	 * @param lockedUntil - The timestamp when the lockout expires
	 */
	async lockAccount(userId: number, lockedUntil: Date): Promise<void> {
		await this.db
			.update(authentication)
			.set({
				lockedUntil,
				updatedAt: new Date(),
			})
			.where(eq(authentication.userId, userId));
	}

	/**
	 * Resets the failed login attempts counter and clears any lockout.
	 * Called on successful authentication.
	 *
	 * @param userId - The user's primary key
	 */
	async resetFailedAttempts(userId: number): Promise<void> {
		await this.db
			.update(authentication)
			.set({
				failedLoginAttempts: 0,
				lockedUntil: null,
				updatedAt: new Date(),
			})
			.where(eq(authentication.userId, userId));
	}
}
