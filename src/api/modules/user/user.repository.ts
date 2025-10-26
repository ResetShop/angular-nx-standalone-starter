import { eq } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import { BaseRepository } from '../../helpers/base.repository';

export interface UserData {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	enabled: boolean;
}

export class UserRepository extends BaseRepository {
	async findByEmail(email: string): Promise<UserData | null> {
		const result = await this.db
			.select({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				enabled: user.enabled,
			})
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		return result.length > 0 ? result[0] : null;
	}
}
