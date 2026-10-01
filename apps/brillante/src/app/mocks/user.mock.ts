import type { IUser } from '@domain/user/user.interface'

/**
 * Create a minimal IUser stub for tests. Override specific fields as needed.
 *
 * @example
 * ```typescript
 * const clerk = createMockUser({ email: 'clerk@test.com' });
 * ```
 */
export function createMockUser(overrides: Partial<IUser> = {}): IUser {
	return {
		id: 1,
		userName: 'test',
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		fullName: 'Test User',
		avatar: null,
		roles: [],
		permissions: [],
		hasFinishedRegistration: true,
		hasPermission: () => false,
		hasRole: () => false,
		...overrides,
	}
}
