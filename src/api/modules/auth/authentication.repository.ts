import { parseDurationToMs } from '@utils/duration';
import { eq, sql } from 'drizzle-orm';
import { authentication } from '../../../db/schema/authentication';
import { DEFAULT_LOCKOUT_DURATION, DEFAULT_MAX_FAILED_ATTEMPTS } from '../../constants/auth.constants';
import { BaseRepository } from '../../helpers/base.repository';
import { type AuthenticationData, type IAuthenticationRepository, type IncrementAttemptsResult } from './interfaces';

/**
 * Repository for authentication-related database operations.
 * Handles password hash storage, retrieval, and account lockout management.
 */
export class AuthenticationRepository extends BaseRepository implements IAuthenticationRepository {
	/**
	 * Gets the maximum number of failed login attempts before account lockout.
	 * Configurable via AUTH_MAX_FAILED_ATTEMPTS environment variable.
	 *
	 * @returns Maximum failed attempts threshold
	 */
	private getMaxFailedAttempts(): number {
		const envValue = process.env['AUTH_MAX_FAILED_ATTEMPTS'];
		const parsed = parseInt(envValue ?? '', 10);
		return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_FAILED_ATTEMPTS;
	}

	/**
	 * Gets the account lockout duration in milliseconds.
	 * Configurable via AUTH_LOCKOUT_DURATION environment variable.
	 *
	 * @returns Lockout duration in milliseconds
	 */
	private getLockoutDuration(): number {
		const duration = process.env['AUTH_LOCKOUT_DURATION'] ?? DEFAULT_LOCKOUT_DURATION;
		try {
			return parseDurationToMs(duration);
		} catch {
			return parseDurationToMs(DEFAULT_LOCKOUT_DURATION);
		}
	}
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
				mustChangePassword: authentication.mustChangePassword,
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
			mustChangePassword: result[0].mustChangePassword ?? false,
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

	/**
	 * Atomically increments failed login attempts and locks account if threshold is reached.
	 * Uses database transaction to ensure both operations succeed or fail together,
	 * preventing race conditions during concurrent login attempts.
	 * Configuration (max attempts, lockout duration) is read from environment variables.
	 *
	 * @param userId - The user's primary key
	 * @returns Result containing new attempt count, lock status, and lockout timestamp
	 */
	async incrementAndLockIfNeeded(userId: number): Promise<IncrementAttemptsResult> {
		const maxAttempts = this.getMaxFailedAttempts();
		const lockDuration = this.getLockoutDuration();

		return this.db.transaction(async (tx) => {
			const incrementResult = await tx
				.update(authentication)
				.set({
					failedLoginAttempts: sql`COALESCE(${authentication.failedLoginAttempts}, 0) + 1`,
					updatedAt: new Date(),
				})
				.where(eq(authentication.userId, userId))
				.returning({ failedLoginAttempts: authentication.failedLoginAttempts });

			const newAttemptCount = incrementResult[0]?.failedLoginAttempts ?? 1;

			if (newAttemptCount >= maxAttempts) {
				const lockedUntil = new Date(Date.now() + lockDuration);
				await tx
					.update(authentication)
					.set({
						lockedUntil,
						updatedAt: new Date(),
					})
					.where(eq(authentication.userId, userId));

				return {
					failedAttempts: newAttemptCount,
					wasLocked: true,
					lockedUntil,
				};
			}

			return {
				failedAttempts: newAttemptCount,
				wasLocked: false,
			};
		});
	}
}
