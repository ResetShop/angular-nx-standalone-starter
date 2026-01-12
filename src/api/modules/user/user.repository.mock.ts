import { type IUserRepository, type UserData } from './interfaces';

export class MockUserRepository implements IUserRepository {
	private users: Map<number, UserData> = new Map();
	private usersByEmail: Map<string, UserData> = new Map();

	/**
	 * Add a user to the mock repository for testing.
	 * @param user User data to add
	 */
	addUser(user: UserData): void {
		this.users.set(user.id, user);
		this.usersByEmail.set(user.email, user);
	}

	/**
	 * Clear all users from the mock repository.
	 */
	clear(): void {
		this.users.clear();
		this.usersByEmail.clear();
	}

	async findByEmail(email: string): Promise<UserData | null> {
		return this.usersByEmail.get(email) ?? null;
	}

	async findById(id: number): Promise<UserData | null> {
		return this.users.get(id) ?? null;
	}
}
