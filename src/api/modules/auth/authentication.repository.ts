import { eq } from 'drizzle-orm';
import { authentication } from '../../../db/schema/authentication';
import { BaseRepository } from '../../helpers/base.repository';
import { type AuthenticationData, type IAuthenticationRepository } from './interfaces';

/**
 * Repository for authentication-related database operations.
 * Handles password hash storage and retrieval for user authentication.
 */
export class AuthenticationRepository extends BaseRepository implements IAuthenticationRepository {
	/**
	 * Finds authentication data for a user by their ID.
	 * Used during login to retrieve the stored password hash for verification.
	 *
	 * @param userId - The user's primary key
	 * @returns Authentication data containing password hash, or null if not found
	 */
	async findByUserId(userId: number): Promise<AuthenticationData | null> {
		const result = await this.db
			.select({
				passwordHash: authentication.passwordHash,
			})
			.from(authentication)
			.where(eq(authentication.userId, userId))
			.limit(1);

		return result.length > 0 ? result[0] : null;
	}
}
