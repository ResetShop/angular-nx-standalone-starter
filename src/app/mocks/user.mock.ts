import type { IUser } from '@domain/user/user.interface';

/**
 * Create a minimal IUser stub for tests. Override specific fields as needed.
 *
 * @example
 * ```typescript
 * const admin = createMockUser({ email: 'admin@test.com', token: 'admin-token' });
 * ```
 */
export function createMockUser(overrides: Partial<IUser> = {}): IUser {
	return {
		id: 1,
		email: 'test@example.com',
		firstName: 'Test',
		lastName: 'User',
		fullName: 'Test User',
		roles: [],
		permissions: [],
		token: 'mock-token',
		hasPermission: () => false,
		hasPermissionByIdentifier: () => false,
		hasRole: () => false,
		...overrides,
	};
}
