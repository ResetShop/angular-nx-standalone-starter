import { eq } from 'drizzle-orm';
import { authentication } from '../../../db/schema/authentication';
import { BaseRepository } from '../../helpers/base.repository';

export interface AuthenticationData {
	passwordHash: string;
}

export class AuthenticationRepository extends BaseRepository {
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
