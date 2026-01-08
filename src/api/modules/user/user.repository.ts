import { eq } from 'drizzle-orm';
import { user } from '../../../db/schema/user';
import { BaseRepository } from '../../helpers/base.repository';
import { type DrizzlePgConnector } from '../../helpers/drizzle-postgres-connector';

export interface UserData {
	id: number;
	email: string;
	firstName: string;
	lastName: string;
	enabled: boolean;
	deleted: boolean;
}

interface UserRepositoryDeps {
	db: DrizzlePgConnector;
}

export class UserRepository extends BaseRepository {
	constructor({ db }: UserRepositoryDeps) {
		super({ db });
	}
	/**
	 * Finds a user by their email address
	 * @param email Email address to search for
	 */
	async findByEmail(email: string): Promise<UserData | null> {
		const result = await this.db
			.select({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				enabled: user.enabled,
				deleted: user.deleted,
			})
			.from(user)
			.where(eq(user.email, email))
			.limit(1);

		return result.length > 0 ? result[0] : null;
	}

	/**
	 * Finds a user by their provided userId
	 * @param id Email address to search for
	 */
	async findById(id: number): Promise<UserData | null> {
		const result = await this.db
			.select({
				id: user.id,
				email: user.email,
				firstName: user.firstName,
				lastName: user.lastName,
				enabled: user.enabled,
				deleted: user.deleted,
			})
			.from(user)
			.where(eq(user.id, id))
			.limit(1);

		return result.length > 0 ? result[0] : null;
	}
}
