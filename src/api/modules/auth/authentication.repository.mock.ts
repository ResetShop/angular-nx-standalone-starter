import { type AuthenticationData, type IAuthenticationRepository } from './interfaces';

export class MockAuthenticationRepository implements IAuthenticationRepository {
	private authRecords: Map<number, AuthenticationData> = new Map();

	/**
	 * Add an authentication record for a user.
	 * @param userId User ID
	 * @param data Authentication data (password hash)
	 */
	addAuthRecord(userId: number, data: AuthenticationData): void {
		this.authRecords.set(userId, data);
	}

	/**
	 * Clear all authentication records.
	 */
	clear(): void {
		this.authRecords.clear();
	}

	async findByUserId(userId: number): Promise<AuthenticationData | null> {
		return this.authRecords.get(userId) ?? null;
	}
}
