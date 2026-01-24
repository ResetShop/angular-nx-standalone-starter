import { type AuthenticationData, type IAuthenticationRepository, type IncrementAttemptsResult } from './interfaces';

interface MockAuthRecord {
	passwordHash: string;
	failedLoginAttempts?: number;
	lockedUntil?: Date | null;
}

export class MockAuthenticationRepository implements IAuthenticationRepository {
	private authRecords: Map<number, MockAuthRecord> = new Map();
	private nextId = 1;

	// Track method calls for testing
	incrementedUsers: number[] = [];
	lockedUsers: Array<{ userId: number; lockedUntil: Date }> = [];
	resetUsers: number[] = [];

	/**
	 * Add an authentication record for a user.
	 * @param userId User ID
	 * @param data Authentication data
	 */
	addAuthRecord(userId: number, data: MockAuthRecord): void {
		this.authRecords.set(userId, data);
	}

	/**
	 * Clear all authentication records and tracking data.
	 */
	clear(): void {
		this.authRecords.clear();
		this.incrementedUsers = [];
		this.lockedUsers = [];
		this.resetUsers = [];
		this.nextId = 1;
	}

	async findByUserId(userId: number): Promise<AuthenticationData | null> {
		const record = this.authRecords.get(userId);
		if (!record) {
			return null;
		}
		return {
			id: this.nextId++,
			userId,
			passwordHash: record.passwordHash,
			failedLoginAttempts: record.failedLoginAttempts ?? 0,
			lockedUntil: record.lockedUntil ?? null,
		};
	}

	async incrementFailedAttempts(userId: number): Promise<number> {
		this.incrementedUsers.push(userId);
		const record = this.authRecords.get(userId);
		if (record) {
			record.failedLoginAttempts = (record.failedLoginAttempts ?? 0) + 1;
			return record.failedLoginAttempts;
		}
		return 1;
	}

	async lockAccount(userId: number, lockedUntil: Date): Promise<void> {
		this.lockedUsers.push({ userId, lockedUntil });
		const record = this.authRecords.get(userId);
		if (record) {
			record.lockedUntil = lockedUntil;
		}
	}

	async resetFailedAttempts(userId: number): Promise<void> {
		this.resetUsers.push(userId);
		const record = this.authRecords.get(userId);
		if (record) {
			record.failedLoginAttempts = 0;
			record.lockedUntil = null;
		}
	}

	async incrementAndLockIfNeeded(userId: number): Promise<IncrementAttemptsResult> {
		// Read from env vars to match production behavior
		const maxAttempts = Number(process.env['AUTH_MAX_FAILED_ATTEMPTS'] ?? '5');
		const lockDuration = 900000; // 15 minutes

		this.incrementedUsers.push(userId);
		const record = this.authRecords.get(userId);

		if (!record) {
			return {
				failedAttempts: 1,
				wasLocked: false,
			};
		}

		record.failedLoginAttempts = (record.failedLoginAttempts ?? 0) + 1;
		const newAttemptCount = record.failedLoginAttempts;

		if (newAttemptCount >= maxAttempts) {
			const lockedUntil = new Date(Date.now() + lockDuration);
			record.lockedUntil = lockedUntil;
			this.lockedUsers.push({ userId, lockedUntil });

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
	}
}
